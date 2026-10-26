import { Body, Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { SalesService } from './sales.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ownClientId, type RequestUser } from '../../auth/client-scope';

@Controller('sales')
export class SalesController {
  constructor(
    private service: SalesService,
    private prisma: PrismaService,
  ) {}

  @Get('listings')
  findListings() {
    return this.service.findListings();
  }

  @Get('listings/:id')
  async findListing(@Param('id') id: string) {
    await this.service.trackView(id);
    return this.service.findListing(id);
  }

  @Post('listings/:id/click')
  trackClick(@Param('id') id: string, @Body() body: { target: string }) {
    return this.service.trackClick(id, body.target);
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  createListing(@Body() body: { vehicleId: string; price: number; description?: string }) {
    return this.service.createListing(body);
  }

  @Post('deals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  async createDeal(@Req() req: { user: RequestUser }, @Body() body: { saleListingId: string; clientId: string; amount: number }) {
    const own = await ownClientId(this.prisma, req.user);
    return this.service.createDeal({ ...body, clientId: own ?? body.clientId });
  }

  @Patch('deals/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  closeDeal(@Param('id') id: string) {
    return this.service.closeDeal(id);
  }
}
