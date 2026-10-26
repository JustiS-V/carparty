// Runs before the API starts:
//   1. syncs the schema (prisma db push),
//   2. on an empty database, seeds according to SEED_MODE:
//        demo — base seed (roles, demo accounts) + demo data (default),
//        base — base seed only, none — nothing (a real deployment),
//   3. with DEMO_REFRESH_DAYS=N (demo mode), rebuilds the demo once its data is
//      older than N days, so the "last 30 days" analytics never go stale.
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
  const mode = process.env.SEED_MODE ?? 'demo';
  if (mode === 'none') {
    console.log('SEED_MODE=none — schema synced, no seed data.');
    return;
  }
  const prisma = new PrismaClient();
  const current = await state(prisma);
  await prisma.$disconnect();

  if (current === 'ready') {
    console.log('Database ready.');
    return;
  }
  if (current === 'stale' && mode === 'demo') {
    console.log(`Demo data older than ${process.env.DEMO_REFRESH_DAYS} days — rebuilding the demo database.`);
    run('npx prisma db push --skip-generate --force-reset');
  }
  if (current === 'stale' && mode !== 'demo') return;
  run('npx tsx prisma/seed.ts');
  if (mode === 'demo') run('npx tsx prisma/demo-seed.ts');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
