import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Verify group exists and user has access
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // If user is a guide, they can only open their own groups
    if (session.user.role === Role.GUIDE && group.guideId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only open your own groups" },
        { status: 403 }
      );
    }

    // If user is a pilgrim, they must be a member
    if (session.user.role === Role.PILGRIM && session.user.currentGroupId !== groupId) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Update user's current group
    await prisma.user.update({
      where: { id: session.user.id },
      data: { currentGroupId: groupId },
    });

    return NextResponse.json({ message: "Group opened successfully" });
  } catch (error) {
    console.error("Open group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

