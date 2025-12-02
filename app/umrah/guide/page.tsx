"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogoutButton } from "@/components/LogoutButton";

interface Group {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  _count: {
    messages: number;
    members: number;
  };
}

export default function GuideDashboardPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Fetch groups
  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["guide-groups"],
    queryFn: async () => {
      const response = await fetch("/api/umrah/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/umrah/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-groups"] });
      setGroupName("");
      setShowForm(false);
    },
  });

  // Open group (set as current and go to chat)
  const openGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch("/api/umrah/groups/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!response.ok) throw new Error("Failed to open group");
      return response.json();
    },
    onSuccess: async () => {
      await update(); // Refresh session to get updated currentGroupId
      router.push("/umrah/chat");
    },
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      createGroupMutation.mutate(groupName.trim());
    }
  };

  const handleOpenGroup = (groupId: string) => {
    openGroupMutation.mutate(groupId);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Guide Dashboard</h1>
            <LogoutButton />
          </div>

          {/* Create Group Form */}
          <div className="mb-8">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                + Create New Group
              </button>
            ) : (
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    id="groupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                    className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setGroupName("");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
                {createGroupMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {createGroupMutation.error.message}
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Groups List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Groups</h2>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No groups yet. Create your first group to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Code: <span className="font-mono font-bold">{group.code}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {group._count.members} member(s) • {group._count.messages} message(s)
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenGroup(group.id)}
                        disabled={openGroupMutation.isPending}
                        className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {openGroupMutation.isPending ? "Opening..." : "Open"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

