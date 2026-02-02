# Phase 1: Client HQ Enhancements Implementation Plan

## Goal Description
Enhance the Client HQ Dashboard to be a true command center. Replace mock data in "God View" with live system health and agent tracking. Improve Shop Management and Personnel Profiles.

## User Review Required
> [!NOTE]
> This phase focuses on connecting the existing UI shells to the real database and enhancing them with "Live" capabilities.

## Proposed Changes

### 1. God View Dashboard (Live Map & Stats)
#### [NEW] [src/app/api/dashboard/stats/route.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/api/dashboard/stats/route.ts)
-   Create API to fetch:
    -   Total Active Agents (Online/Offline status based on `lastSeen`).
    -   Total Sales Today.
    -   Active Shops count.
    -   Recent Activity Log (Sales, Attendance Pings).

#### [MODIFY] [src/app/dashboard/map/page.tsx](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/dashboard/map/page.tsx)
-   Replace `activeUnits` mock array with `SWR` or `useEffect` fetch from `/api/dashboard/stats` and `/api/mobile/pulse` (for locations).
-   Implement "Live Feed" list of agents.
-   **Note**: The map visualization itself is currently "Simulated" in the UI (Radar view). We will link the "Active Field Units" sidebar to real data first.

### 2. Shop Management
#### [MODIFY] [src/app/shops/page.tsx](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/shops/page.tsx)
-   Ensure the list displays all shops for the logged-in Organization.
-   Add "Add Shop" modal if missing or broken.

### 3. Personnel Profile
#### [NEW] [src/app/dashboard/agents/page.tsx](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/dashboard/agents/page.tsx)
-   List all agents with their current status (Green/Red dot).
-   Click to view "Agent Detail" (Sales history, Attendance log).

### 4. Admin ↔ Agent Messaging
#### [NEW] [src/app/api/messages/route.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/api/messages/route.ts)
-   GET: Fetch conversation history for a specific agent (or all for admin).
-   POST: Send a message (admin to agent).

#### [NEW] [src/app/dashboard/messages/page.tsx](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/dashboard/messages/page.tsx)
-   Chat interface with list of agents on the left.
-   Chat window on the right.
-   Real-time (polling) updates.

### 5. HR & Leave Management
#### [MODIFY] [src/app/dashboard/hr/enrollment/page.tsx](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/dashboard/hr/enrollment/page.tsx)
-   Enhance validation (Email uniqueness check).
-   Assign `organizationId` automatically from session.

#### [NEW] [src/app/api/hr/member/[id]/route.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/api/hr/member/[id]/route.ts)
-   GET: Fetch full profile including Leaves and Disciplinary Records.
-   PUT: Update profile details.

#### [NEW] [src/app/api/hr/leave/route.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/api/hr/leave/route.ts)
-   POST: Submit leave request.
-   PUT: Approve/Reject leave request.

#### [MODIFY] [src/app/dashboard/hr/member/[id]/page.tsx](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/dashboard/hr/member/[id]/page.tsx)
-   Add Tabs: "Profile", "Leave History", "Desciplinary".
-   Implement actions to Approve/Reject leaves.

### 6. Mobile Sales Logger (Phase 2B)
#### [MODIFY] [src/app/api/sales/route.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/api/sales/route.ts)
-   Implement `POST` method.
-   Use `prisma.$transaction` for atomic stock updates and sale recording.
-   Fail entire sale if any item is out of stock.

#### [MODIFY] [src/app/mobilepos/pos/page.tsx](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/mobilepos/pos/page.tsx)
-   Improve UI feedback for stock errors.
-   Ensure "Complete Sale" calls the new secure endpoint.

### Phase 3: Intelligence & Developer Tools
#### [NEW] [src/app/api/analytics/export/route.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/api/analytics/export/route.ts)
-   GET: Generate CSV streams for Sales, Attendance, and Inventory.
-   Parameters: `type` (sales|attendance), `from`, `to`.

#### [NEW] [src/lib/abuse-detection.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/lib/abuse-detection.ts)
-   Utility to analyze sales velocity and GPS jump anomalies.
-   Called during `POST /api/sales` and `POST /api/mobile/pulse`.

#### [NEW] [src/app/api/payments/paystack/route.ts](file:///Users/truth/DEVELOPMENT/nexus-platform/src/app/api/payments/paystack/route.ts)
-   Webhook handler for Paystack events (Subscription active/expired).
-   Update `Subscription` model in Prisma.

## Verification Plan
-   **God View**: Verify the "Active Field Units" sidebar lists the seed agent "Ernest Agent".
-   **Status Check**: Log in as agent on mobile, send a pulse, and verify status turns "Online" on Dashboard.
