import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

console.log("DATABASE_URL:", process.env.DATABASE_URL) // keep for now

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL ,
  ssl: {
    rejectUnauthorized: false  // ← required for Neon/Supabase/Railway etc.
  }
 })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

export default prisma