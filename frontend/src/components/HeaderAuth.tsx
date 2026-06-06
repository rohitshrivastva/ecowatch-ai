"use client";

import Link from "next/link";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HeaderAuth() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <span className="text-xs text-eco-muted">...</span>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-xs text-eco-muted hover:text-eco-primary transition-colors px-3 py-1.5 rounded-lg border border-eco-border hover:border-eco-primary/50"
        >
          <LogIn className="w-3.5 h-3.5" />
          Sign in
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 text-xs text-white bg-eco-primary hover:bg-eco-primary/90 transition-colors px-3 py-1.5 rounded-lg font-medium"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-eco-muted hidden sm:inline">
        {user?.full_name || user?.email}
      </span>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-1.5 text-xs text-eco-muted hover:text-eco-danger transition-colors px-3 py-1.5 rounded-lg border border-eco-border hover:border-eco-danger/50"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign out
      </button>
    </div>
  );
}
