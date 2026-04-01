"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      await handleSignup();
    } else {
      await handleSignin();
    }

    setLoading(false);
  }

  async function handleSignin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }

    setLoading(false);
  }

  async function handleSignup() {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Create the user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
      }
    );

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;
    if (userId) {
      // Insert approval request
      await supabase.from("user_approvals").insert({
        user_id: userId,
        email,
        approved: false,
      } as any);

      // Notify admin via edge function
      try {
        await supabase.functions.invoke("notify-signup", {
          body: { email },
        });
      } catch {
        // Non-critical — admin notification failed but signup still works
      }
    }

    // Sign out — user must wait for approval
    await supabase.auth.signOut();

    setSignupSuccess(true);
  }

  if (resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-4xl">&#9993;</div>
          <h1 className="text-xl font-bold">Check Your Email</h1>
          <p className="text-slate-400">
            If an account exists for {email}, you&apos;ll receive a password
            reset link shortly.
          </p>
          <button
            onClick={() => {
              setResetSent(false);
              setForgotMode(false);
            }}
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-4xl">&#9989;</div>
          <h1 className="text-xl font-bold">Account Created!</h1>
          <p className="text-slate-400">
            Your account has been submitted for review. The administrator will
            review and approve your account shortly. You&apos;ll be able to sign
            in once approved.
          </p>
          <button
            onClick={() => {
              setSignupSuccess(false);
              setMode("signin");
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Mobile Library</h1>
          <p className="text-slate-400 mt-1">
            {forgotMode
              ? "Enter your email to reset your password"
              : mode === "signin"
                ? "Sign in to continue"
                : "Create an account"}
          </p>
        </div>

        {/* Mode toggle */}
        {!forgotMode && <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            className={`flex-1 py-2 text-sm font-medium ${
              mode === "signin"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`flex-1 py-2 text-sm font-medium ${
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign Up
          </button>
        </div>}

        <form onSubmit={forgotMode ? handleForgotPassword : handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm text-slate-400 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {!forgotMode && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm text-slate-400 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Your password"
                />
              </div>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError("");
                  }}
                  className="text-blue-400 text-sm hover:text-blue-300"
                >
                  Forgot password?
                </button>
              )}

              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm text-slate-400 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Confirm your password"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forgotMode
              ? loading
                ? "Sending..."
                : "Send Reset Link"
              : loading
                ? mode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "signin"
                  ? "Sign In"
                  : "Sign Up"}
          </button>

          {forgotMode && (
            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setError("");
              }}
              className="w-full text-blue-400 text-sm hover:text-blue-300"
            >
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
