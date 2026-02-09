import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-paystack-signature");
        const secret = process.env.PAYSTACK_SECRET_KEY;

        // 1. Verify Signature (Security)
        if (secret && signature) {
            const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
            if (hash !== signature) {
                return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
            }
        }

        // 🛡️ Safe JSON parsing
        let event;
        try {
            event = JSON.parse(rawBody);
        } catch (e) {
            console.error('Failed to parse Paystack webhook:', e);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        // 2. Handle Events
        switch (event.event) {
            case "subscription.create":
            case "charge.success":
                await handleSubscriptionSuccess(event.data);
                break;

            case "subscription.disable":
            case "invoice.payment_failed":
                await handleSubscriptionFailure(event.data);
                break;

            default:
                console.log("Unhandled Paystack Event:", event.event);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("WEBHOOK_ERROR:", error);
        return NextResponse.json({ error: "Webhook Failed" }, { status: 500 });
    }
}

// ✅ SUCCESS HANDLER
async function handleSubscriptionSuccess(data: any) {
    // Logic: Find subscription by email or code, then activate Organization
    const email = data.customer?.email;
    const subCode = data.subscription_code || data.reference;

    if (!email) return;

    // Find User -> Organization
    const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
    });

    if (user?.organizationId) {
        // Activate Organization
        await prisma.organization.update({
            where: { id: user.organizationId },
            data: {
                status: 'ACTIVE',
                nextBillingDate: new Date(data.next_payment_date || Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        // Log Subscription
        // Note: In a real app we might upsert a Subscription record here
        console.log(`✅ Organization ${user.organization.name} Activated via Paystack: ${subCode}`);
    }
}

// ❌ FAILURE HANDLER
async function handleSubscriptionFailure(data: any) {
    const email = data.customer?.email;
    if (!email) return;

    const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
    });

    if (user?.organizationId) {
        // Suspend Organization
        await prisma.organization.update({
            where: { id: user.organizationId },
            data: { status: 'LOCKED_PAYMENT' }
        });
        console.log(`⛔ Organization ${user.organization.name} Suspended (Payment Failed)`);
    }
}
