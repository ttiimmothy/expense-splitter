import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      provider: 'email'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      provider: 'email'
    }
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      provider: 'email'
    }
  });

  console.log('👥 Created users:', { user1: user1.name, user2: user2.name, user3: user3.name });

  // Create a demo group
  const group = await prisma.group.create({
    data: {
      name: 'Trip to Japan',
      currency: 'USD',
      members: {
        create: [
          { userId: user1.id, role: 'OWNER' },
          { userId: user2.id, role: 'MEMBER' },
          { userId: user3.id, role: 'MEMBER' }
        ]
      }
    }
  });

  console.log('🏠 Created group:', group.name);

  // Create sample expenses
  const expense1 = await prisma.expense.create({
    data: {
      groupId: group.id,
      description: 'Flight tickets',
      amount: 1200.00,
      split: 'EQUAL',
      shares: {
        create: [
          { userId: user1.id, amountPaid: 400.00 },
          { userId: user2.id, amountPaid: 400.00 },
          { userId: user3.id, amountPaid: 400.00 }
        ]
      }
    }
  });

  const expense2 = await prisma.expense.create({
    data: {
      groupId: group.id,
      description: 'Hotel accommodation',
      amount: 900.00,
      split: 'EQUAL',
      shares: {
        create: [
          { userId: user1.id, amountPaid: 300.00 },
          { userId: user2.id, amountPaid: 300.00 },
          { userId: user3.id, amountPaid: 300.00 }
        ]
      }
    }
  });

  const expense3 = await prisma.expense.create({
    data: {
      groupId: group.id,
      description: 'Dinner at fancy restaurant',
      amount: 150.00,
      split: 'CUSTOM',
      shares: {
        create: [
          { userId: user1.id, amountPaid: 50.00 },
          { userId: user2.id, amountPaid: 50.00 },
          { userId: user3.id, amountPaid: 50.00 }
        ]
      }
    }
  });

  console.log('💰 Created expenses:', { 
    expense1: expense1.description, 
    expense2: expense2.description, 
    expense3: expense3.description 
  });

  // Create a settlement
  // const settlement = await prisma.settlement.create({
  //   data: {
  //     groupId: group.id,
  //     fromUserId: user2.id,
  //     toUserId: user1.id,
  //     amount: 100.00
  //   }
  // });

  // console.log('💸 Created settlement:', `$${settlement.amount} from ${user2.name} to ${user1.name}`);

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: 3`);
  console.log(`- Groups: 1`);
  console.log(`- Expenses: 3`);
  console.log(`- Settlements: 1`);
  console.log('\n🔑 Demo credentials:');
  console.log('Email: alice@example.com (or bob@example.com, charlie@example.com)');
  console.log('Password: any password (authentication is simplified for demo)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
