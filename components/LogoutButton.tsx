"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = async () => {
    // Sign out without redirect
    await signOut({ redirect: false });
    // Manually redirect to ensure we use the correct domain
    if (typeof window !== "undefined") {
      window.location.href = `${window.location.origin}/login`;
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
    >
      Logout
    </button>
  );
}

