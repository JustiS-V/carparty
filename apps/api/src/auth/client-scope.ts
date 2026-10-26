import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import type { PrismaService } from '../prisma/prisma.service';

export type RequestUser = { id: string; role: UserRole };

/**
 * Clients may only touch their own records. For a CLIENT this returns the
 * client profile id taken from the token — never from the request body; for
 * staff (worker, super admin) it returns null, meaning "no restriction".
 */
export async function ownClientId(prisma: PrismaService, user: RequestUser): Promise<string | null> {
  if (user.role !== UserRole.CLIENT) return null;
  const profile = await prisma.client.clientProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!profile) throw new ForbiddenException('Client profile not found');
  return profile.id;
}

/** 404 rather than 403 for someone else's record, so ids can't be probed. */
export function assertOwned(record: { clientId: string | null } | null, clientId: string | null) {
  if (!record || (clientId && record.clientId !== clientId)) throw new NotFoundException();
}
