import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import CarbonCredit from "@/models/CarbonCredit";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const transferSchema = z.object({
  recipientEmail: z.string().email(),
  quantity: z.number().min(1),
});

// POST transfer credits to another user
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

    // Only active credits can be transferred
    if (credit.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Only active credits can be transferred" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = transferSchema.safeParse(body);

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

    const { recipientEmail, quantity } = validationResult.data;

    // Check quantity
    if (quantity > credit.quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient credit quantity" },
        { status: 400 }
      );
    }

    // Find recipient
    const recipient = await User.findOne({
      email: recipientEmail.toLowerCase(),
    });
    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Cannot transfer to yourself
    if (recipient._id.toString() === session.userId) {
      return NextResponse.json(
        { success: false, error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    // If transferring all credits, update the existing record
    if (quantity === credit.quantity) {
      credit.previousOwners.push({
        owner: credit.owner,
        transferredAt: new Date(),
        quantity: quantity,
      });
      credit.owner = recipient._id;
      credit.status = "transferred";
      await credit.save();

      // Create new active credit for recipient
      const newCredit = new CarbonCredit({
        creditId: `${credit.creditId}-T`,
        project: credit.project,
        vintage: credit.vintage,
        quantity: quantity,
        status: "active",
        owner: recipient._id,
        metadata: credit.metadata,
      });
      await newCredit.save();
    } else {
      // Partial transfer - reduce original and create new
      credit.quantity -= quantity;
      await credit.save();

      const newCredit = new CarbonCredit({
        project: credit.project,
        vintage: credit.vintage,
        quantity: quantity,
        status: "active",
        owner: recipient._id,
        previousOwners: [
          {
            owner: credit.owner,
            transferredAt: new Date(),
            quantity: quantity,
          },
        ],
        metadata: credit.metadata,
      });
      await newCredit.save();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${quantity} credits to ${recipientEmail}`,
    });
  } catch (error) {
    console.error("Transfer credits error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
