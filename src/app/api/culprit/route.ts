import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  // 1. DEFINING THE SUSPECTS (Connection Strings)
  // We test the safest one: IPv4 (aws-1) + Session Mode (5432) + Your Password
  const CONNECTION_STRING = "postgresql://postgres.lqkpyqcokdeaefmisgbs:Sedofia1010.@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

  // Create a fresh client just for this test
  const prisma = new PrismaClient({
    datasources: { db: { url: CONNECTION_STRING } },
  });

  const report = {
    step_1_connection: "PENDING",
    step_2_user_check: "PENDING",
    step_3_agent_check: "PENDING",
    culprit_identified: "UNKNOWN",
    details: "",
  };

  try {
    // 🔍 TEST 1: Can we even reach the server?
    await prisma.$connect();
    report.step_1_connection = "✅ SUCCESS (Network is good)";

    // 🔍 TEST 2: Does your specific user ID exist?
    // This is the ID from your error logs: cmkzpbmrr0000p9vsamugnfo7
    const specificUser = await prisma.user.findUnique({
      where: { id: "cmkzpbmrr0000p9vsamugnfo7" },
    });

    if (specificUser) {
      report.step_2_user_check = "✅ SUCCESS (User exists)";
      report.details = `User found: ${specificUser.email} (Role: ${specificUser.role})`;
    } else {
      report.step_2_user_check = "❌ FAILED";
      report.culprit_identified = "DATA_SYNC_ERROR";
      report.details = "The User ID 'cmkzpbmrr...' does not exist in this database. The app is trying to load a ghost user.";
      return NextResponse.json(report, { status: 404 });
    }

    // 🔍 TEST 3: Is the user actually an AGENT?
    if (specificUser.role === "AGENT") {
        report.step_3_agent_check = "✅ SUCCESS";
        report.culprit_identified = "NONE (Database is perfect)";
        report.details += " - This user is a valid Agent. The issue is likely in the App Login page code, not the database.";
    } else {
        report.step_3_agent_check = "❌ FAILED";
        report.culprit_identified = "PERMISSION_ERROR";
        report.details += ` - This user is a ${specificUser.role}, NOT an AGENT. Access denied.`;
    }

    return NextResponse.json(report);

  } catch (error: any) {
    report.step_1_connection = "❌ FAILED";
    report.details = error.message;

    // 🕵️‍♂️ IDENTIFYING THE NETWORK CULPRIT
    if (error.message.includes("prepared statement")) {
        report.culprit_identified = "TRANSACTION_MODE_ERROR";
        report.details = "The server is forcing Port 6543 (Transaction Mode). We need Port 5432.";
    } else if (error.message.includes("Can't reach database")) {
        report.culprit_identified = "NETWORK_BLOCKING";
        report.details = "Your Internet Provider is blocking the connection. Try a Mobile Hotspot.";
    } else if (error.message.includes("password authentication failed")) {
        report.culprit_identified = "WRONG_PASSWORD";
        report.details = "The password 'Sedofia1010.' is incorrect.";
    } else {
        report.culprit_identified = "UNKNOWN_DB_ERROR";
    }

    return NextResponse.json(report, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}