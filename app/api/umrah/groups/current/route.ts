import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        currentGroup: {
          include: {
            guide: {
              select: {
                id: true,
                name: true,
              },
            },
            messages: {
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    if (!user?.currentGroup) {
      return NextResponse.json(
        { error: "No active group found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      group: {
        id: user.currentGroup.id,
        name: user.currentGroup.name,
        code: user.currentGroup.code,
        guideId: user.currentGroup.guideId,
        guideName: user.currentGroup.guide.name,
        createdAt: user.currentGroup.createdAt,
      },
      messages: user.currentGroup.messages.map((msg) => ({
        id: msg.id,
        type: msg.type,
        text: msg.text,
        imageUrl: msg.imageUrl,
        senderId: msg.senderId,
        senderName: msg.sender.name,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error("Fetch current group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

