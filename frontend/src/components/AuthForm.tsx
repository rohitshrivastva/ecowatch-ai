"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "register";
  onSubmit: (data: {
    email: string;
    password: string;
    fullName?: string;
  }) => Promise<void>;
};

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        email,
        password,
        fullName: isRegister ? fullName : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto glass-panel p-8 animate-fade-in-up">
      <div className="flex flex-col items-center mb-8">
        <div className="p-3 rounded-xl bg-eco-primary/10 mb-4">
          <Leaf className="w-8 h-8 text-eco-primary" />
        </div>
        <h2 className="text-2xl font-bold text-eco-text">
          {isRegister ? "Create account" : "Welcome back"}
        </h2>
        <p className="text-sm text-eco-muted mt-1 text-center">
          {isRegister
            ? "Sign up to access environmental analysis"
            : "Sign in to analyze locations on the map"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs text-eco-muted mb-1.5">
              Full name (optional)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-eco-border text-eco-text text-sm focus:outline-none focus:border-eco-primary"
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-eco-muted mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-eco-border text-eco-text text-sm focus:outline-none focus:border-eco-primary"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs text-eco-muted mb-1.5">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-eco-border text-eco-text text-sm focus:outline-none focus:border-eco-primary"
            placeholder="At least 8 characters"
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </div>

        {error && (
          <p className="text-sm text-eco-danger bg-eco-danger/10 border border-eco-danger/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-eco-primary text-white font-semibold text-sm hover:bg-eco-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs text-eco-muted mt-6">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-eco-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/register" className="text-eco-primary hover:underline">
              Register
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
