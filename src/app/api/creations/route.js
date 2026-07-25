import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

// GET — list creations or poll a specific requestId
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    const headerApiKey = req.headers.get("x-custom-api-key");
    const customApiKey = headerApiKey || session.user.customApiKey || null;

    if (requestId) {
      const statusData = await AIService.checkStatus(requestId, customApiKey);
      return NextResponse.json(statusData);
    }

    const creations = await prisma.royalPortraitCreation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Self-healing: sync any still-processing items
    const updated = await Promise.all(
      creations.map(async (c) => {
        if (c.status === "processing" && c.requestId) {
          try {
            await AIService.checkStatus(c.requestId, customApiKey);
            return (
              (await prisma.royalPortraitCreation.findUnique({
                where: { id: c.id },
              })) || c
            );
          } catch {
            return c;
          }
        }
        return c;
      })
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST — submit a new royal portrait generation
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { inputImage, styleName, aspectRatio } = body;

    if (!inputImage) return new NextResponse("Missing inputImage", { status: 400 });
    if (!styleName) return new NextResponse("Missing styleName", { status: 400 });

    const headerApiKey = req.headers.get("x-custom-api-key");
    const customApiKey = headerApiKey || body.customApiKey || session.user.customApiKey || null;
    const isUsingCustomKey = Boolean(customApiKey && customApiKey.trim().length > 0);

    const cost = isUsingCustomKey ? 0 : AIService.getCreditCost();

    if (!isUsingCustomKey && cost > 0) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });

      if (!user || user.credits < cost) {
        return new NextResponse(
          `Insufficient credits. Required: ${cost}, balance: ${user?.credits ?? 0}`,
          { status: 400 }
        );
      }
    }

    const creation = await AIService.generate(
      session.user.id,
      {
        inputImage,
        styleName,
        aspectRatio: aspectRatio || "auto",
      },
      customApiKey
    );

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[CREATIONS_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
