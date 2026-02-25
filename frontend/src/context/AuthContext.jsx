import { createContext, useState, useEffect, useCallback } from "react";
import supabase from "../config/supabaseClient";

// Exported separately so the useAuth hook file can import it
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser) => {
    const userId = typeof authUser === "string" ? authUser : authUser?.id;
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      // Wait briefly so the Supabase client session is fully ready
      await new Promise((r) => setTimeout(r, 100));

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("fetchProfile SELECT error:", error.message);
        throw error;
      }

      if (data) {
        setProfile(data);
        return;
      }

      // Profile not found — create it
      if (typeof authUser === "object" && authUser) {
        const payload = {
          id: authUser.id,
          email: authUser.email || "",
          phone: authUser.user_metadata?.phone || null,
          full_name: authUser.user_metadata?.full_name || null,
          updated_at: new Date().toISOString(),
        };

        const { data: created, error: createError } = await supabase
          .from("profiles")
          .upsert(payload, { onConflict: "id" })
          .select()
          .single();

        if (createError) {
          console.error("fetchProfile UPSERT error:", createError.message);
          // Even if upsert fails, try to use the payload as a fallback
          setProfile({ ...payload, created_at: new Date().toISOString() });
          return;
        }
        setProfile(created || null);
        return;
      }

      setProfile(null);
    } catch (err) {
      console.error("fetchProfile failed:", err?.message || err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const sessionTimeoutMs = 7000;

    const withTimeout = (promise, timeoutMs) =>
      Promise.race([
        promise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Session initialization timed out")), timeoutMs);
        }),
      ]);

    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, sessionTimeoutMs + 1000);

    const init = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          sessionTimeoutMs
        );
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // Resolve loading immediately so the UI renders without waiting for profile
        if (mounted) setLoading(false);
        if (currentUser) {
          fetchProfile(currentUser);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setLoading(false);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { phone },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    // Clear local auth state first for instant UI response
    setUser(null);
    setProfile(null);

    // Defensive cleanup for persisted Supabase auth keys
    if (typeof window !== "undefined" && window.localStorage) {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          window.localStorage.removeItem(key);
        }
      });
    }

    try {
      const result = await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((resolve) => setTimeout(() => resolve({ error: null }), 1200)),
      ]);
      return result || { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: "Not authenticated" } };
    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email || "",
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select()
        .single();
      if (error) {
        console.error("updateProfile error:", error.message);
        return { data: null, error };
      }
      if (data) setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error("updateProfile failed:", err?.message || err);
      return { data: null, error: err };
    }
  };

  const syncProfile = useCallback(async () => {
    if (!user) return { error: { message: "Not authenticated" } };

    try {
      // First, try to fetch the existing profile
      const { data: existingData, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("syncProfile fetch error:", fetchError.message);
        return { data: null, error: fetchError };
      }

      // If a profile already exists, do not overwrite it with potentially stale user_metadata.
      if (existingData) {
        setProfile(existingData);
        return { data: existingData, error: null };
      }

      // Profile does not exist yet (e.g. initial login), safe to initialize using user_metadata.
      const payload = {
        id: user.id,
        email: user.email || "",
        phone: user.user_metadata?.phone || null,
        full_name: user.user_metadata?.full_name || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.error("syncProfile upsert error:", error.message);
        // Use local payload as fallback so the UI still shows data
        setProfile((prev) => prev || { ...payload, created_at: user.created_at || new Date().toISOString() });
        return { data: null, error };
      }

      if (data) setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error("syncProfile failed:", err?.message || err);
      return { data: null, error: err };
    }
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    syncProfile,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
