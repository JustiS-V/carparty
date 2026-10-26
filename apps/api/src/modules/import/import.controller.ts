import { Body, Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { ImportService } from './import.service';
import { PrismaService } from '../../prisma/prisma.service';
import { assertOwned, ownClientId, type RequestUser } from '../../auth/client-scope';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(
    private service: ImportService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.WORKER, UserRole.SUPER_ADMIN)
  async findOne(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    const record = await this.service.findOne(id);
    assertOwned(record, await ownClientId(this.prisma, req.user));
    return record;
  }

  @Post()
  @Roles(UserRole.CLIENT, UserRole.WORKER, UserRole.SUPER_ADMIN)
  async create(@Req() req: { user: RequestUser }, @Body() body: { clientId: string; budget?: number; notes?: string }) {
    const own = await ownClientId(this.prisma, req.user);
    return this.service.create({ ...body, clientId: own ?? body.clientId });
  }

  @Patch(':id/status')
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }
}
