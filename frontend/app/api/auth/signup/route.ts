import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { createSession } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

// Generate unique wallet address for each user
function generateWalletAddress(): string {
  const randomBytes = crypto.randomBytes(20);
  return "0x" + randomBytes.toString("hex");
}

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  role: z
    .enum(["project_owner", "verifier", "investor", "viewer"])
    .default("viewer"),
  organization: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
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

    const { email, password, name, role, organization } = validationResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // Generate unique wallet address for new user
    const walletAddress = generateWalletAddress();

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      role,
      organization,
      walletAddress, // Store generated wallet address
    });

    await user.save();

    // Create session
    await createSession({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Return user data (without password)
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
          walletAddress, // Include wallet address in response
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
