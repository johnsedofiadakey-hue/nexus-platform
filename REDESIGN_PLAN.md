# Enterprise Redesign Implementation Plan

## Changes to Implement:

### 1. Design System Updates
- **Border Radius**: Change from 2xl/3xl (16-24px) to md/lg (6-8px) for professional look
- **Shadows**: Reduce shadow intensity, use subtle elevation
- **Colors**: Maintain clean grays, use color sparingly for CTAs only
- **Typography**: Keep bold headings but reduce ALL CAPS overuse
- **Spacing**: Tighter, more compact layouts
- **Cards**: Flat or subtle borders, no heavy shadows

### 2. Settings Page Fixes
- ✅ Theme context exists
- ❌ Colors not applied to components
- **Fix**: Apply CSS variables throughout components
- **Fix**: Make logo upload functional
- **Fix**: Add role management to team section
- **Fix**: Connect subscription management

### 3. Field Reports Relocation
- **From**: `/dashboard/reports` (admin-level)
- **To**: `/dashboard/hr/member/[id]` Personnel Portal → Field Reports tab
- **Benefit**: All agent data in one place, easier download/export

### 4. Activity Log Integration
- **Current**: Separate page only
- **Add**: Widget on main dashboard showing recent 10 activities
- **Design**: Clean table, no excessive styling

### 5. Files to Modify:
1. `src/app/dashboard/settings/page.tsx` - Fix functionality
2. `src/app/dashboard/page.tsx` - Add activity log widget, redesign
3. `src/app/dashboard/hr/member/[id]/page.tsx` - Redesign, add field reports
4. `src/components/dashboard/hr/IntelBoard.tsx` - Integrate as reports view
5. Global CSS - Add enterprise design tokens
6. Remove `/dashboard/reports` page (redirect to personnel)

Let's implement systematically...
