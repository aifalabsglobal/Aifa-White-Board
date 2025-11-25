import { config } from 'dotenv'
config()

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient as PrismaAccelerator } from '@prisma/client'

const connectionString = process.env.DATABASE_URL!

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaAccelerator | undefined
}

export const db =
  globalForPrisma.prisma ?? new PrismaAccelerator({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
