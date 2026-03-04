import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import supabase from "../config/supabaseClient";

// Exported separately so the useAuth hook file can import it
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser) => {
    const userId = typeof authUser === "string" ? authUser : authUser?.id;
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
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
  }, []);

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
  }, [fetchProfile]);

  const signUp = useCallback(async (email, password, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { phone },
      },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setProfile(null);

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
  }, []);

  const updateProfile = useCallback(async (updates) => {
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
  }, [user]);

  const syncProfile = useCallback(async () => {
    if (!user) return { error: { message: "Not authenticated" } };

    try {
      const { data: existingData, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("syncProfile fetch error:", fetchError.message);
        return { data: null, error: fetchError };
      }

      if (existingData) {
        setProfile(existingData);
        return { data: existingData, error: null };
      }

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

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    syncProfile,
    fetchProfile,
  }), [user, profile, loading, signUp, signIn, signOut, updateProfile, syncProfile, fetchProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
