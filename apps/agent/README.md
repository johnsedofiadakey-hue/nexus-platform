# Nexus Agent Portal

Mobile-first portal for field agents - POS, attendance tracking, and shop operations.

## Features

- 📱 **Mobile POS**: Point of sale optimized for mobile devices
- 📍 **GPS Attendance**: Location-verified clock in/out
- 🚀 **Offline-First**: PWA with offline capabilities
- 🗺️ **Maps Integration**: Real-time location tracking
- 📊 **Sales Reports**: Quick performance insights
- 🏪 **Shop Operations**: Field staff management

## Development

```bash
# From monorepo root
pnpm dev:agent

# Or from this directory
pnpm dev
```

The agent portal runs on **http://localhost:3002**

## Building

```bash
# From monorepo root
pnpm build:agent

# Or from this directory
pnpm build
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://app.your-domain.com"
NEXTAUTH_SECRET="your-secret-here"
```

## Deployment

### Vercel (Recommended)

1. Import this app separately in Vercel
2. **Framework Preset**: Next.js
3. **Root Directory**: `apps/agent`
4. Set environment variables in Vercel dashboard
5. Deploy!

**Custom Domain**: Set up `app.your-domain.com`

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Mobile Optimization

- **GPS Accuracy**: 50m threshold with visual indicators
- **High Accuracy Mode**: Enabled for precise location tracking
- **PWA Support**: Install as native app on mobile devices
- **Offline Sync**: Queue actions when offline, sync when online

## Access Levels

- **Field Agents**: POS and attendance
- **Shop Managers**: Shop-level reports and oversight
- **Supervisors**: Multi-shop field operations

## Tech Stack

- Next.js 16.1.6
- TypeScript
- Prisma (shared database)
- NextAuth
- Tailwind CSS
- Leaflet Maps
- Geolib for GPS
- Shared UI components from `@nexus/ui`
