import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Get user with current group
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currentGroupId: true },
    });

    if (!user?.currentGroupId) {
      return NextResponse.json(
        { error: "You are not in any group" },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        groupId: user.currentGroupId,
        senderId: session.user.id,
        type: "TEXT",
        text: text.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: message.id,
      type: message.type,
      text: message.text,
      imageUrl: message.imageUrl,
      senderId: message.senderId,
      senderName: message.sender.name,
      createdAt: message.createdAt,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

