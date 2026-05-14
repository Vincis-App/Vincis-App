import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Gerando matérias de teste...');

  const testDisciplines = [
    { name: 'Matemática', color: '#ef4444', weight: 10, priority: 'HIGH', proficiency: 0.2, active: true },
    { name: 'Português', color: '#3b82f6', weight: 8, priority: 'HIGH', proficiency: 0.4, active: true },
    { name: 'História', color: '#10b981', weight: 5, priority: 'MEDIUM', proficiency: 0.6, active: true },
    { name: 'Física', color: '#f59e0b', weight: 3, priority: 'LOW', proficiency: 0.1, active: true },
    { name: 'Direito', color: '#8b5cf6', weight: 7, priority: 'MEDIUM', proficiency: 0.3, active: true },
  ];

  for (const disc of testDisciplines) {
    await prisma.discipline.upsert({
      where: { name: disc.name },
      update: disc,
      create: disc,
    });
  }

  console.log('✅ Matérias de teste inseridas com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
