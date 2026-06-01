import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import CarbonCredit from "@/models/CarbonCredit";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const retireSchema = z.object({
  quantity: z.number().min(1),
  purpose: z.string().min(1).max(500),
});

// POST retire credits (permanently remove from circulation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { id } = await params;
    const credit = await CarbonCredit.findById(id);

    if (!credit) {
      return NextResponse.json(
        { success: false, error: "Credit not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (credit.owner.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Only active credits can be retired
    if (credit.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Only active credits can be retired" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = retireSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { quantity, purpose } = validationResult.data;

    // Check quantity
    if (quantity > credit.quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient credit quantity" },
        { status: 400 }
      );
    }

    if (quantity === credit.quantity) {
      // Retire all credits
      credit.status = "retired";
      credit.retiredFor = purpose;
      credit.retiredAt = new Date();
      await credit.save();
    } else {
      // Partial retirement - reduce original and create retired record
      credit.quantity -= quantity;
      await credit.save();

      const retiredCredit = new CarbonCredit({
        project: credit.project,
        vintage: credit.vintage,
        quantity: quantity,
        status: "retired",
        owner: credit.owner,
        retiredFor: purpose,
        retiredAt: new Date(),
        metadata: credit.metadata,
      });
      await retiredCredit.save();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully retired ${quantity} credits`,
    });
  } catch (error) {
    console.error("Retire credits error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
