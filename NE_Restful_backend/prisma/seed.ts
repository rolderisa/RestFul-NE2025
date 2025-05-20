import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        firstName: 'Regular',
        lastName: 'User',
        email: 'user@example.com',
        password: userPassword,
        role: 'USER'
      }
    });

    // Create parkings
    await prisma.parking.upsert({
      where: { code: 'P001' },
      update: {},
      create: {
        code: 'P001',
        name: 'Central Parking',
        totalSpaces: 100,
        availableSpaces: 100,
        location: 'Downtown',
        hourlyFee: 2.5
      }
    });

    await prisma.parking.upsert({
      where: { code: 'P002' },
      update: {},
      create: {
        code: 'P002',
        name: 'North Parking',
        totalSpaces: 50,
        availableSpaces: 50,
        location: 'North District',
        hourlyFee: 2.0
      }
    });

    await prisma.parking.upsert({
      where: { code: 'P003' },
      update: {},
      create: {
        code: 'P003',
        name: 'Airport Parking',
        totalSpaces: 200,
        availableSpaces: 200,
        location: 'Airport',
        hourlyFee: 3.5
      }
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();