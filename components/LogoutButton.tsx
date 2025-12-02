"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = () => {
    // Use the current origin to ensure we redirect to the correct domain
    const callbackUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/login`
      : "/login";
    signOut({ callbackUrl });
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

