import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Check if we can talk to the database
    // This tests the Hardcoded Connection string
    await prisma.$connect();

    // 2. Search for the Agent User we saw in your logs
    // ID: "cmkzpbmrr0000p9vsamugnfo7"
    const user = await prisma.user.findUnique({
      where: { id: "cmkzpbmrr0000p9vsamugnfo7" },
      select: { 
        id: true, 
        email: true, 
        role: true, // IMPORTANT: Is this user actually an AGENT?
        name: true 
      }
    });

    // 3. Search for any user with the email that matches your login
    // Replace 'your-email@example.com' if you know the exact agent email
    const allAgents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: { email: true, id: true }
    });

    return NextResponse.json({
      STATUS: "✅ SYSTEM ONLINE",
      CONNECTION: "Database Connected Successfully (Port 5432 Hybrid)",
      
      // THE CULPRIT CHECKLIST:
      CULPRIT_1_USER_FOUND: user ? "Yes" : "❌ NO (User ID from logs does not exist)",
      CULPRIT_2_USER_ROLE: user?.role || "N/A",
      CULPRIT_3_AGENT_EMAIL: user?.email || "N/A",
      
      // If the specific user is broken, here are valid agents you CAN login with:
      VALID_AGENTS_IN_DB: allAgents
    });

  } catch (error: any) {
    return NextResponse.json({
      STATUS: "❌ SYSTEM FAILURE",
      CULPRIT: "The Database Connection is STILL blocking us.",
      ERROR_DETAILS: error.message,
    }, { status: 500 });
  }
}