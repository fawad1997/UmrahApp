import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const filename = `${user.currentGroupId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    // Use the blob URL
    const imageUrl = blob.url;

    // Create message
    const message = await prisma.message.create({
      data: {
        groupId: user.currentGroupId,
        senderId: session.user.id,
        type: "IMAGE",
        imageUrl,
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
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

