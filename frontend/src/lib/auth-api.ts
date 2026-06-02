import type { AuthSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function registerUser(payload: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Registration failed (${response.status})`);
  }

  return response.json();
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Login failed (${response.status})`);
  }

  return response.json();
}
