import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  // Placeholder: Return 0 to stop the client error immediately
  // Later, connect this to prisma.message.count()
  return NextResponse.json({ count: 0 });
}