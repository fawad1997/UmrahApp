"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
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

