# Nexus Admin Portal

Admin portal for managing the Nexus platform - HR, inventory, analytics, and system configuration.

## Features

- 📊 **Dashboard & Analytics**: Comprehensive business intelligence
- 👥 **HR Management**: Personnel portal, attendance, performance tracking
- 📦 **Inventory Management**: Stock control and supply chain
- 🏪 **Shop Management**: Multi-location store oversight
- ⚙️ **System Configuration**: Platform settings and controls
- 👑 **Super User Controls**: Advanced administration

## Development

```bash
# From monorepo root
pnpm dev:admin

# Or from this directory
pnpm dev
```

The admin portal runs on **http://localhost:3001**

## Building

```bash
# From monorepo root
pnpm build:admin

# Or from this directory
pnpm build
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://admin.your-domain.com"
NEXTAUTH_SECRET="your-secret-here"
```

## Deployment

### Vercel (Recommended)

1. Import this app separately in Vercel
2. **Framework Preset**: Next.js
3. **Root Directory**: `apps/admin`
4. Set environment variables in Vercel dashboard
5. Deploy!

**Custom Domain**: Set up `admin.your-domain.com`

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Access Levels

- **Super Admins**: Full system access
- **HR Managers**: Personnel and attendance
- **Inventory Managers**: Stock and supply chain
- **Shop Managers**: Store-specific access

## Tech Stack

- Next.js 16.1.6
- TypeScript
- Prisma (shared database)
- NextAuth
- Tailwind CSS
- Shared UI components from `@nexus/ui`
