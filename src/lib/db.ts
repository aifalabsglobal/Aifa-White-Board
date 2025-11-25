import { config } from 'dotenv
config()

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient as PrismaClientAccelerator } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// This is the correct type now
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientAccelerator | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClientAccelerator({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
