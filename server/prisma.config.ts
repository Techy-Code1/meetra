import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { config } from 'dotenv'

config({ path: './.env' })  // ← needed here for CLI commands

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL
  },
  migrate: {
    async adapter(env: { DATABASE_URL: string }) {
      const pool = new pg.Pool({
        connectionString: env.DATABASE_URL,
        ssl: true
      })
      return new PrismaPg(pool)
    }
  }
} as any)