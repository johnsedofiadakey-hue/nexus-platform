# SalesNexus - System Gap Analysis

**Date**: 2026-02-02
**Status**: 🚧 Significant Gaps Identified

## 1. Core Architecture (Multi-Tenancy)
**Requirement**: Dedicated "Client/Organization" level separate from "Shops".
**Current State**: The system operates at the `Shop` level. Users are directly linked to Shops. There is no `Organization` model grouping multiple shops under one Client.
**Gap**: 🔴 **CRITICAL**. Need to introduce an `Organization` or `Client` model to separate tenants effectively. `Shop` should belong to `Organization`.

## 2. Client HQ Dashboard
-   **God View**: ✅ `src/app/dashboard/map/page.tsx` exists. Needs verification of "Live" aspects and "System Health" counters.
-   **Shop Management**: ✅ `Shop` model and pages exist.
-   **Personnel Profile**: 🟡 Partially implemented. HR models (`LeaveRequest`, `DisciplinaryRecord`) exist in schema, but full "Agent Portal" with live monitoring integration needs verification.
-   **Messaging**: 🟡 `Message` model exists, but "WhatsApp-style" interface and priority system need implementation.
-   **HR & Leave**: ✅ Schema supports this. UI needs to be robust.

## 3. Mobile Agent App
-   **Smart Attendance**: 🔴 **MISSING**. `Attendance` model exists, but the "Smart" logic (geofence + buffer enforcement, offline caching) is likely missing or basic.
-   **Sales Logger**: ✅ Basic POS exists. Needs "Stock-gating" and "Rate-limiting" verification.
-   **Funnel Reporting**: 🔴 **MISSING**. No "Walk-ins" or "Inquiries" counters found in schema or mobile UI.

## 4. Intelligence & Abuse
-   **Abuse Detection**: 🔴 **MISSING**. No automated system to flag "Rapid sale spamming" or "GPS edge-hugging".
-   **Analytics**: 🟡 Basic reporting exists. Need "Exportable PDF/CSV" and advanced "Integrity Reports".

## 5. Developer / Owner Panel (Super User)
-   **Control Panel**: 🟡 `src/app/super-user` exists but is likely rudimentary.
-   **Capabilities**: 🔴 **MISSING**. No "Client suspension", "Force logout", or "Database backup" controls visible in the code.

## 6. Payments & Subscriptions
-   **Integration**: 🔴 **MISSING**. No Paystack integration or Subscription models (`Plan`, `Subscription`, `Invoice`) in the schema.

---

## Recommended Roadmap

### Phase 1: Architecture Refactor (The Foundation)
1.  **Multi-tenancy**: Introduce `Organization` model. Migrate existing `Shops` and `Users` to belong to an Organization.
2.  **Super User Upgrade**: Build the tooling to manage these Organizations (Create, Suspend, View).

### Phase 2: Core Feature Completion
1.  **Mobile Funnel**: Add `DailyReport` enhancements for walk-ins/inquiries.
2.  **Smart Attendance**: Implement the rigid geofencing logic on mobile.
3.  **Messaging**: Build the chat interface.

### Phase 3: Enterprise Features
1.  **Payments**: Integrate Paystack.
2.  **Abuse Detection**: Build the anomaly detection engine.
