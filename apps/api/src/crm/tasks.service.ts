import { Injectable } from '@nestjs/common';
import { CrmModule } from '@carparty/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.task.findMany({
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: {
    title: string;
    description?: string;
    module: CrmModule;
    assigneeId?: string;
    createdById: string;
  }) {
    return this.prisma.client.task.create({
      data,
      include: { assignee: true },
    });
  }

  markDone(id: string) {
    return this.prisma.client.task.update({
      where: { id },
      data: { isDone: true },
    });
  }
}
