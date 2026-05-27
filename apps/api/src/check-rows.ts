import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const count = await prisma.edital.count()
  console.log('Edital count:', count)
  const editais = await prisma.edital.findMany()
  console.log('Editais:', editais)
}

main().catch(err => console.error(err)).finally(() => {
  prisma.$disconnect()
  pool.end()
})
