import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "../src/context/AuthContext";
import supabase from "../src/config/supabaseClient";

// Mock Supabase
vi.mock("../src/config/supabaseClient", () => {
  const mockSubscription = { unsubscribe: vi.fn() };
  return {
    default: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: mockSubscription } })),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })),
    },
  };
});

function ConsumerComponent() {
  const { user, profile, loading, signIn, signUp, signOut, updateProfile } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="loading-status">{loading ? "loading" : "idle"}</span>
      <span data-testid="user-email">{user?.email || "no user"}</span>
      <span data-testid="user-profile">{profile?.full_name || "no profile"}</span>
      <button onClick={() => signIn("test@example.com", "password")}>Sign In</button>
      <button onClick={() => signUp("new@example.com", "password", "1234567890")}>Sign Up</button>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={() => updateProfile({ full_name: "New Name" })}>Update Profile</button>
    </div>
  );
}

describe("AuthContext Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("initializes with loading state, then resolves to unauthenticated when getSession returns null", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    await act(async () => {
      render(
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("loading-status").textContent).toBe("idle");
    expect(screen.getByTestId("user-email").textContent).toBe("no user");
  });

  it("calls supabase signUp when context signUp is executed", async () => {
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { email: "new@example.com" } },
      error: null,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      );
    });

    const signUpBtn = screen.getByText("Sign Up");
    await act(async () => {
      signUpBtn.click();
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password",
      options: { data: { phone: "1234567890" } },
    });
  });

  it("calls supabase signInWithPassword when context signIn is executed", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      );
    });

    const signInBtn = screen.getByText("Sign In");
    await act(async () => {
      signInBtn.click();
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });
  });

  it("clears sb-* tokens from localstorage and calls signOut on sign out", async () => {
    localStorage.setItem("sb-provider-auth-token", "some-token");
    localStorage.setItem("other-key", "do-not-delete");

    supabase.auth.signOut.mockResolvedValueOnce({ error: null });

    await act(async () => {
      render(
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      );
    });

    const signOutBtn = screen.getByText("Sign Out");
    await act(async () => {
      signOutBtn.click();
    });

    expect(localStorage.getItem("sb-provider-auth-token")).toBeNull();
    expect(localStorage.getItem("other-key")).toBe("do-not-delete");
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("handles optimistic updates and rollback on profile update failure", async () => {
    // Mock user being logged in
    const mockUser = { id: "user_123", email: "test@example.com" };
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: mockUser } } });

    // Mock first profile fetch returning current profile
    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { id: "user_123", full_name: "Original Name", email: "test@example.com" },
      error: null,
    });
    supabase.from.mockReturnValue({
      select: selectMock,
      eq: eqMock,
      maybeSingle: maybeSingleMock,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <ConsumerComponent />
        </AuthProvider>
      );
    });

    // Verify initial profile name loaded
    expect(await screen.findByTestId("user-profile")).toHaveTextContent("Original Name");

    // Now mock update API to FAIL
    const updateMock = vi.fn().mockReturnThis();
    const updateEqMock = vi.fn().mockReturnThis();
    const updateSelectMock = vi.fn().mockReturnThis();
    const updateSingleMock = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Database error"),
    });

    supabase.from.mockReturnValue({
      update: updateMock,
      eq: updateEqMock,
      select: updateSelectMock,
      single: updateSingleMock,
    });

    const updateBtn = screen.getByText("Update Profile");
    
    // We execute the click. It should optimistically update, then rollback on error
    await act(async () => {
      updateBtn.click();
    });

    // Since we caught the database error, it should log the error and rollback to "Original Name"
    expect(screen.getByTestId("user-profile")).toHaveTextContent("Original Name");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: "New Name" })
    );
  });
});
