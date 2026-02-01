# Nexus Platform

A Next.js-based platform for managing retail operations, sales, and messaging.

## Features

- 🔐 Secure authentication with NextAuth.js and bcrypt
- 💬 Real-time messaging system
- 📊 Sales and inventory management
- 📍 Location-based shop management
- 👥 Multi-role user system (Admin, Agent, Sales Rep, etc.)

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexus-platform
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)
   
   **Login with default credentials**:
   - Email: `admin@nexus.com`
   - Password: `admin123`

## Testing

For comprehensive testing instructions, see [TESTING.md](./TESTING.md).

Quick test:
```bash
# Test authentication
npm run dev
# Visit http://localhost:3000/auth/login

# Test message insertion
node scripts/e2e/insert-message.js

# Test message API
# While logged in, visit http://localhost:3000/api/mobile/messages
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed the database
- `npm run db:push` - Push schema changes to database
- `npm run e2e:messages` - Run end-to-end message tests

## Project Structure

```
nexus-platform/
├── prisma/               # Database schema and migrations
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/             # Next.js app directory
│   │   ├── api/         # API routes
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard pages
│   │   └── mobilepos/   # Mobile POS pages
│   ├── components/      # React components
│   ├── lib/             # Utilities and configurations
│   │   ├── auth.ts      # NextAuth configuration
│   │   └── prisma.ts    # Prisma client
│   └── middleware.ts    # Route protection
├── scripts/             # Utility scripts
│   └── e2e/            # End-to-end test scripts
└── public/             # Static assets
```

## Authentication

This application uses NextAuth.js with bcrypt password hashing. All passwords are securely hashed before being stored in the database.

**Important**: Change default passwords before deploying to production.

## Security

- All passwords are hashed with bcrypt (10 rounds)
- Sessions use JWT strategy
- Protected routes require authentication via middleware
- Environment variables used for sensitive data

⚠️ **Never commit**:
- `.env` file
- Real credentials or secrets
- Production database URLs

## Deployment

### Environment Variables

Set the following in your deployment platform:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)
- `NODE_ENV=production`

### Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]
