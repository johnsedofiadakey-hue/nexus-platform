# Deploying Nexus Platform to Vercel

This guide will walk you through deploying your Nexux Platform to the web using **Vercel** (Database) and **Neon/Supabase** (Database).

## Prerequisites

1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
3.  **Database Provider**: We recommend **Neon** (Serverless Postgres) or **Supabase**.

---

## Step 1: Push to GitHub

If you haven't already, push your code to a new GitHub repository.

```bash
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/nexus-platform.git
git push -u origin main
```

---

## Step 2: Set up Database (Supabase)

You are already using **Supabase** in development. You can:
1.  **Reuse the existing project**: Use the same `DATABASE_URL` from your `.env` file.
2.  **Create a Production Project**: Go to [supabase.com](https://supabase.com), create a new project, and get the connection string (Transaction Mode @ 6543 or Session Mode @ 5432).

**Important**: For Vercel (Serverless), use the **Transaction Mode (Port 6543)** connection string for better performance, or the **Session Mode (Port 5432)** if you face timeout issues.

---

## Step 3: Deploy to Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2.  Import your `nexus-platform` repository.
3.  **Configure Project**:
    *   **Framework Preset**: Next.js (Auto-detected).
    *   **Root Directory**: `./` (Default).
4.  **Environment Variables** (Expand the section):
    Add the following variables:

    | Name | Value |
    | :--- | :--- |
    | `DATABASE_URL` | Your **Supabase** Connection String. |
    | `DIRECT_URL` | Your **Supabase** Direct Connection String (Port 5432). |
    | `NEXTAUTH_SECRET` | Generate a new random string (run `openssl rand -base64 32` in terminal). |
    | `NEXTAUTH_URL` | Leave empty (Vercel sets this automatically). |
    | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (Your Vercel URL). |

5.  Click **Deploy**.

---

## Step 4: Post-Deployment Database Hydration

Once the deployment process starts, Vercel will build your app. However, the database is empty. You need to push your schema.

1.  In your local terminal, verify you can connect to the production DB (Optional) OR let Vercel handle migrations during build.
2.  **Recommended**: Add a Build Command in Vercel settings if migrations fail, OR run this locally pointing to the prod DB:
    ```bash
    DATABASE_URL="your_neon_url" npx prisma db push
    ```
3.  **Seeding**: To get the Admin user, you might need to run the seed script locally against the prod DB:
    ```bash
    DATABASE_URL="your_neon_url" npx prisma db seed
    ```

## Troubleshooting

-   **Prisma Client Error**: If you see errors about "Prisma Client", go to Vercel Settings > Build & Development, and change the Build Command to:
    `npx prisma generate && next build`
-   **Images**: If using local images, they work fine. For user uploads, you need a storage provider like **Uploadthing** or **AWS S3** since Vercel file system is ephemeral.

---

**Done!** Your app should be live at `https://nexus-platform.vercel.app`.
