// Run before the API starts on a hosted demo:
//   1. syncs the schema (prisma db push),
//   2. loads the base seed and the demo data into an empty database,
//   3. with DEMO_REFRESH_DAYS=N, rebuilds the demo once its data is older than N
//      days, so the "last 30 days" analytics on a public demo never go stale.
// Usage: pnpm --filter @carparty/database ensure-demo
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const run = (cmd: string) => execSync(cmd, { stdio: 'inherit', cwd: __dirname + '/..' });

async function state(prisma: PrismaClient): Promise<'empty' | 'stale' | 'ready'> {
  const users = await prisma.user.count();
  if (users === 0) return 'empty';
  const days = Number(process.env.DEMO_REFRESH_DAYS ?? 0);
  if (!days) return 'ready';
  // The base seed creates the admin, so its creation time is when the demo was built.
  const admin = await prisma.user.findUnique({ where: { email: 'admin@carparty.local' }, select: { createdAt: true } });
  const ageDays = admin ? (Date.now() - admin.createdAt.getTime()) / 86400000 : Infinity;
  return ageDays > days ? 'stale' : 'ready';
}

async function main() {
  run('npx prisma db push --skip-generate');
  const prisma = new PrismaClient();
  const current = await state(prisma);
  await prisma.$disconnect();

  if (current === 'ready') {
    console.log('Database ready.');
    return;
  }
  if (current === 'stale') {
    console.log(`Demo data older than ${process.env.DEMO_REFRESH_DAYS} days — rebuilding the demo database.`);
    run('npx prisma db push --skip-generate --force-reset');
  }
  run('npx tsx prisma/seed.ts');
  run('npx tsx prisma/demo-seed.ts');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
