import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a guide
    if (session.user.role !== Role.GUIDE) {
      return NextResponse.json(
        { error: "Only guides can send announcements" },
        { status: 403 }
      );
    }

    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Announcement text is required" },
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

    // Create announcement message
    const message = await prisma.message.create({
      data: {
        groupId: user.currentGroupId,
        senderId: session.user.id,
        type: "ANNOUNCEMENT",
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

    // Send SMS to group members with phone numbers (non-blocking)
    // Fetch group members
    const groupMembers = await prisma.user.findMany({
      where: {
        currentGroupId: user.currentGroupId,
        phone: {
          not: null,
        },
      },
      select: {
        phone: true,
        name: true,
      },
    });

    // Prepare SMS recipients
    if (groupMembers.length > 0) {
      const smsRecipients = groupMembers
        .filter((member) => member.phone)
        .map((member) => ({
          phone: member.phone!,
          message: `[ANNOUNCEMENT] ${text.trim()}`,
        }));

      // Send SMS asynchronously (don't wait for completion)
      sendSMS(smsRecipients).catch((error) => {
        console.error("SMS sending error (non-blocking):", error);
      });
    }

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
    console.error("Send announcement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

