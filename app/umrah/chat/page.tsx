"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { formatMessageTime } from "@/lib/utils";
import { Role } from "@prisma/client";
import { LogoutButton } from "@/components/LogoutButton";

interface Message {
  id: string;
  type: string;
  text: string | null;
  imageUrl: string | null;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface GroupData {
  group: {
    id: string;
    name: string;
    code: string;
    guideId: string;
    guideName: string;
  };
  messages: Message[];
}

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current group and messages
  const { data: groupData, isLoading } = useQuery<GroupData>({
    queryKey: ["current-group"],
    queryFn: async () => {
      const response = await fetch("/api/umrah/groups/current");
      if (!response.ok) {
        if (response.status === 404) {
          // No active group
          if (session?.user?.role === Role.GUIDE) {
            router.push("/umrah/guide");
          } else {
            router.push("/umrah/join");
          }
          throw new Error("No active group");
        }
        throw new Error("Failed to fetch group");
      }
      return response.json();
    },
    enabled: !!session,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Send text message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/umrah/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-group"] });
      setMessageText("");
    },
  });

  // Send image mutation
  const sendImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/umrah/messages/image", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-group"] });
      setShowImageUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  // Send announcement mutation
  const sendAnnouncementMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/umrah/messages/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send announcement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-group"] });
      setAnnouncementText("");
      setShowAnnouncementForm(false);
    },
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupData?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      sendImageMutation.mutate(file);
    }
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (announcementText.trim()) {
      sendAnnouncementMutation.mutate(announcementText.trim());
    }
  };

  const isGuide = session?.user?.role === Role.GUIDE;
  const isOwnMessage = (senderId: string) => senderId === session?.user?.id;

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!groupData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {groupData.group.name}
            </h1>
            {isGuide && (
              <p className="text-sm text-gray-500">
                Code: <span className="font-mono font-bold">{groupData.group.code}</span>
              </p>
            )}
            {!isGuide && (
              <p className="text-sm text-gray-600">Guide: {groupData.group.guideName}</p>
            )}
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {groupData.messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          groupData.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message.senderId) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === "ANNOUNCEMENT"
                    ? "bg-yellow-100 border-2 border-yellow-400"
                    : isOwnMessage(message.senderId)
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                {message.type === "ANNOUNCEMENT" && (
                  <div className="text-xs font-semibold text-yellow-800 mb-1">
                    📢 ANNOUNCEMENT
                  </div>
                )}
                {!isOwnMessage(message.senderId) && (
                  <div
                    className={`text-xs font-semibold mb-1 ${
                      message.type === "ANNOUNCEMENT" ? "text-yellow-800" : "text-gray-600"
                    }`}
                  >
                    {message.senderName}
                  </div>
                )}
                {message.type === "IMAGE" && message.imageUrl ? (
                  <div className="mb-2">
                    <Image
                      src={message.imageUrl}
                      alt="Shared image"
                      width={500}
                      height={500}
                      className="max-w-full h-auto rounded cursor-pointer"
                      onClick={() => window.open(message.imageUrl!, "_blank")}
                      unoptimized
                    />
                  </div>
                ) : null}
                {message.text && (
                  <div
                    className={`${
                      message.type === "ANNOUNCEMENT"
                        ? "text-yellow-900"
                        : isOwnMessage(message.senderId)
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                <div
                  className={`text-xs mt-1 ${
                    message.type === "ANNOUNCEMENT"
                      ? "text-yellow-700"
                      : isOwnMessage(message.senderId)
                      ? "text-indigo-200"
                      : "text-gray-500"
                  }`}
                >
                  {formatMessageTime(new Date(message.createdAt))}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Announcement Form (Guide only) */}
      {showAnnouncementForm && isGuide && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <form onSubmit={handleSendAnnouncement} className="space-y-2">
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Enter announcement message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={sendAnnouncementMutation.isPending}
                className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {sendAnnouncementMutation.isPending ? "Sending..." : "Send Announcement"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAnnouncementForm(false);
                  setAnnouncementText("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            {sendAnnouncementMutation.isError && (
              <div className="text-sm text-red-600">
                {sendAnnouncementMutation.error.message}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Input Area */}
      {!showAnnouncementForm && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <div className="flex-1">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendImageMutation.isPending}
              className="px-4 py-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50"
              title="Attach image"
            >
              {sendImageMutation.isPending ? "..." : "📷"}
            </button>
            {isGuide && (
              <button
                type="button"
                onClick={() => setShowAnnouncementForm(true)}
                className="px-4 py-2 text-gray-600 hover:text-yellow-600"
                title="Send announcement"
              >
                📢
              </button>
            )}
            <button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
          {sendMessageMutation.isError && (
            <div className="text-sm text-red-600 mt-2">
              {sendMessageMutation.error.message}
            </div>
          )}
          {sendImageMutation.isError && (
            <div className="text-sm text-red-600 mt-2">
              {sendImageMutation.error.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

