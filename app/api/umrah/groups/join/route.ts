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

    // Check if user is a pilgrim
    if (session.user.role !== Role.PILGRIM) {
      return NextResponse.json(
        { error: "Only pilgrims can join groups" },
        { status: 403 }
      );
    }

    const { code } = await request.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Group code is required" },
        { status: 400 }
      );
    }

    // Find group by code
    const group = await prisma.group.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        guide: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Invalid group code" },
        { status: 404 }
      );
    }

    // Update user's current group
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { currentGroupId: group.id },
      select: {
        currentGroupId: true,
      },
    });

    return NextResponse.json({
      message: "Successfully joined group",
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        guideName: group.guide.name,
      },
      currentGroupId: updatedUser.currentGroupId,
    });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

