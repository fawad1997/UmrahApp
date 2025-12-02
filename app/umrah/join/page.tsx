"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { LogoutButton } from "@/components/LogoutButton";

export default function JoinGroupPage() {
  const router = useRouter();
  const { update } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const joinGroupMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/umrah/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join group");
      }

      return response.json();
    },
    onSuccess: async () => {
      await update();
      router.push("/umrah/chat");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter a group code");
      return;
    }

    joinGroupMutation.mutate(code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-200 relative">
        <div className="absolute top-4 right-4">
          <LogoutButton />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Group</h1>
          <p className="text-slate-600">
            Enter the group code provided by your guide
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-slate-700 mb-2">
              Group Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="ABCD12"
              className="w-full px-4 py-4 text-center text-3xl font-mono font-bold tracking-widest border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase bg-slate-50"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={joinGroupMutation.isPending || !code.trim()}
            className="w-full py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Contact your guide if you don't have a group code
        </p>
      </div>
    </div>
  );
}
