import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// This route is an alias for GET /api/umrah/groups
// Kept for backwards compatibility
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== Role.GUIDE) {
      return NextResponse.json(
        { error: "Only guides can view their groups" },
        { status: 403 }
      );
    }

    const groups = await prisma.group.findMany({
      where: {
        guideId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Fetch groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

