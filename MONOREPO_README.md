# Nexus Platform - Monorepo

A split-architecture platform with separate admin and agent portals sharing a common database.

## 🏗️ Architecture

```
nexus-platform/
├── apps/
│   ├── admin/          # Admin Portal (admin.nexus.com)
│   └── agent/          # Agent Portal (app.nexus.com)
├── packages/
│   ├── database/       # Shared Prisma schema & client
│   └── ui/            # Shared UI components
```

## ✨ Key Benefits

- **🔒 Security**: Agents can't access admin URLs
- **🚀 Independent Deployment**: Update one without affecting the other
- **📱 Optimization**: Mobile-first for agents, desktop for admins
- **♻️ Code Reuse**: Shared database, UI, and utilities
- **⚡ Scalability**: Scale each portal independently

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+ (install: `npm install -g pnpm`)

### Installation

```bash
# Install dependencies for entire monorepo
pnpm install

# Generate Prisma client
pnpm db:generate
```

### Development

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev:admin    # Admin portal on :3001
pnpm dev:agent    # Agent portal on :3002
```

### Building

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build:admin
pnpm build:agent
```

## 📦 Applications

### Admin Portal (`apps/admin`)
**URL**: `admin.your-domain.com`  
**Port**: 3001 (local dev)

**Features**:
- Dashboard & Analytics
- HR Management & Personnel Portal
- Inventory Management
- Shop Management
- Super User Controls

**Access**: Admins, HR Managers, Inventory Managers

### Agent Portal (`apps/agent`)
**URL**: `app.your-domain.com`  
**Port**: 3002 (local dev)

**Features**:
- Mobile POS
- GPS Attendance Tracking
- Field Operations
- Shop-level Reports

**Access**: Field Agents, Shop Managers, Supervisors

## 📚 Shared Packages

### `@nexus/database`
Shared Prisma schema and client. Both apps connect to the same database.

```bash
# Update database schema
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Open Prisma Studio
cd packages/database && pnpm db:studio
```

### `@nexus/ui`
Shared UI components (buttons, cards, inputs, etc.)

## 🌍 Deployment

### Option 1: Separate Vercel Projects (Recommended)

#### Admin Portal
1. Create new Vercel project
2. Import from GitHub
3. **Root Directory**: `apps/admin`
4. Set custom domain: `admin.your-domain.com`
5. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://admin.your-domain.com
   NEXTAUTH_SECRET=your-secret
   ```

#### Agent Portal
1. Create another Vercel project
2. Import from GitHub
3. **Root Directory**: `apps/agent`
4. Set custom domain: `app.your-domain.com`
5. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://app.your-domain.com
   NEXTAUTH_SECRET=your-secret
   ```

### Option 2: Self-Hosted

```bash
# Build both apps
pnpm build

# Start admin portal
cd apps/admin && pnpm start

# Start agent portal (in another terminal)
cd apps/agent && pnpm start
```

Use a reverse proxy (Nginx/Caddy) to route domains to different ports.

## 🔧 Environment Variables

Each app needs its own `.env.local`:

### Admin (`apps/admin/.env.local`)
```env
DATABASE_URL="postgresql://postgres.xxx:xxx@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
NEXTAUTH_URL="https://admin.your-domain.com"
NEXTAUTH_SECRET="your-secret-here"
```

### Agent (`apps/agent/.env.local`)
```env
DATABASE_URL="postgresql://postgres.xxx:xxx@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
NEXTAUTH_URL="https://app.your-domain.com"
NEXTAUTH_SECRET="your-secret-here"
```

**⚠️ Important**: Both apps use the **same** DATABASE_URL but **different** NEXTAUTH_URL values.

## 🛠️ Scripts

### Root Level
```bash
pnpm dev              # Run all apps
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm clean            # Clean all build artifacts
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Update database schema
```

### App Specific
```bash
pnpm dev:admin        # Run admin portal only
pnpm dev:agent        # Run agent portal only
pnpm build:admin      # Build admin portal only
pnpm build:agent      # Build agent portal only
```

## 📊 Database

Both applications share a single Supabase PostgreSQL database:
- **Connection Mode**: Transaction pooling (port 6543)
- **ORM**: Prisma 6.19.2
- **Schema Location**: `packages/database/prisma/schema.prisma`

### Schema Updates

```bash
# Make changes to packages/database/prisma/schema.prisma
# Then push to database
pnpm db:push

# Generate updated Prisma client
pnpm db:generate
```

Both apps will automatically use the updated schema.

## 🔐 Authentication

- **Provider**: NextAuth
- **Strategy**: JWT
- **Database Adapter**: Prisma
- **Session Storage**: Database

Each app has its own authentication flow but shares the same user database.

## 🤝 Contributing

### Adding a New Feature

**Admin Feature**:
1. Add code to `apps/admin/src/`
2. Test: `pnpm dev:admin`
3. Build: `pnpm build:admin`

**Agent Feature**:
1. Add code to `apps/agent/src/`
2. Test: `pnpm dev:agent`
3. Build: `pnpm build:agent`

**Shared Component**:
1. Add to `packages/ui/components/`
2. Export from `packages/ui/index.tsx`
3. Import in both apps: `import { Button } from '@nexus/ui'`

**Database Change**:
1. Update `packages/database/prisma/schema.prisma`
2. Run `pnpm db:push`
3. Run `pnpm db:generate`

## 📱 Mobile Performance

Agent portal is optimized for mobile:
- PWA support (installable)
- GPS accuracy: 50m threshold
- High accuracy location mode
- Offline-first architecture
- Touch-optimized UI

## 🏢 Production Setup

### Recommended Architecture

```
┌─────────────────────────────────────┐
│   admin.nexus.com (Vercel)         │
│   ├─ Dashboard                      │
│   ├─ HR Management                  │
│   └─ System Config                  │
└────────────┬────────────────────────┘
             │
             ↓
      ┌─────────────┐
      │  Supabase   │  ← Shared Database
      │  PostgreSQL │
      └─────────────┘
             ↑
             │
┌────────────┴────────────────────────┐
│   app.nexus.com (Vercel)           │
│   ├─ Mobile POS                     │
│   ├─ Attendance                     │
│   └─ Field Ops                      │
└─────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Clean everything and reinstall
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database Connection Issues

```bash
# Test connection
cd packages/database
pnpm db:push
```

### Port Already in Use

```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9  # Admin
lsof -ti:3002 | xargs kill -9  # Agent
```

## 📄 License

Private - All rights reserved

## 📞 Support

For deployment assistance or issues, check the individual app READMEs:
- [Admin Portal](./apps/admin/README.md)
- [Agent Portal](./apps/agent/README.md)
