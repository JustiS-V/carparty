import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@carparty/database';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private service: SalesService) {}

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
  createDeal(@Body() body: { saleListingId: string; clientId: string; amount: number }) {
    return this.service.createDeal(body);
  }

  @Patch('deals/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  closeDeal(@Param('id') id: string) {
    return this.service.closeDeal(id);
  }
}
