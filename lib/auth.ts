export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: "user" | "admin"
  createdAt: Date
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  isGuest?: boolean
  updatedAt?: Date
}

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@example.com"

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName })
  });

  if (!res.ok) {
    let errorMsg = 'Failed to sign up';
    try {
      const err = await res.json();
      errorMsg = err.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  const data = await res.json();
  return data.user;
}

export const signInWithEmail = async (email: string, password: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    let errorMsg = 'Failed to sign in';
    try {
      const err = await res.json();
      errorMsg = err.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  const data = await res.json();
  return data.user;
}

export const signInWithGoogle = async () => {
  throw new Error("Google Sign-In is not supported without Firebase. Please use email/password.");
}

export const signOutUser = async () => {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sign out');
}

export const confirmGuestPassword = async (newPassword: string) => {
  const res = await fetch('/api/auth/confirm-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
  if (!res.ok) {
    let errorMsg = 'Failed to confirm password';
    try {
      const err = await res.json();
      errorMsg = err.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  const data = await res.json();
  return data;
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const res = await fetch(`/api/auth/me`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      if (data && data.user) {
        return {
          ...data.user,
          createdAt: new Date(data.user.createdAt),
          updatedAt: new Date(data.user.updatedAt)
        }
      }
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}
