import { defineConfig } from 'prisma'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // This is where Migrate and Introspection get their URLs now
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
})