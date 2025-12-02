"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

export default function RoleSelectionPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError("");
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/umrah/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update role");
      } else {
        await update();
        
        if (selectedRole === "GUIDE") {
          router.push("/umrah/guide");
        } else {
          router.push("/umrah/join");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Umrah Messenger</h1>
          <p className="text-lg font-medium text-slate-600">Welcome! Please choose your role:</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-md">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect("GUIDE")}
            className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
              selectedRole === "GUIDE"
                ? "border-blue-600 bg-blue-50 shadow-md"
                : "border-slate-200 hover:border-blue-300 bg-white"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                  selectedRole === "GUIDE"
                    ? "border-blue-600 bg-blue-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedRole === "GUIDE" && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  I am a GUIDE
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Create and manage a group
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("PILGRIM")}
            className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
              selectedRole === "PILGRIM"
                ? "border-blue-600 bg-blue-50 shadow-md"
                : "border-slate-200 hover:border-blue-300 bg-white"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                  selectedRole === "PILGRIM"
                    ? "border-blue-600 bg-blue-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedRole === "PILGRIM" && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  I am a PILGRIM
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Join an existing group
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          className="w-full py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          {loading ? "Processing..." : "CONTINUE"}
        </button>

        <p className="text-center text-xs text-slate-500">
          You can change your role later in settings
        </p>
      </div>
    </div>
  );
}
