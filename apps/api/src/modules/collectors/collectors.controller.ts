import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadStatus, UserRole } from '@carparty/database';
import type { ExternalSource } from '@carparty/types';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/guards/roles.guard';
import { CollectorsService } from './collectors.service';
import {
  CreateChannelDto,
  IngestLeadDto,
  UpdateChannelDto,
  UpdateLeadStatusDto,
} from './dto/collectors.dto';
import { CollectorApiKeyGuard } from './guards/collector-api-key.guard';

@Controller('collectors')
export class CollectorsController {
  constructor(private service: CollectorsService) {}

  @Post('ingest')
  @UseGuards(CollectorApiKeyGuard)
  ingest(@Body() body: IngestLeadDto) {
    return this.service.ingest(body);
  }

  @Get('leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  findLeads(
    @Query('source') source?: ExternalSource,
    @Query('status') status?: LeadStatus,
  ) {
    return this.service.findLeads({ source, status });
  }

  @Get('leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  findLead(@Param('id') id: string) {
    return this.service.findLead(id);
  }

  @Patch('leads/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  updateLeadStatus(@Param('id') id: string, @Body() body: UpdateLeadStatusDto) {
    return this.service.updateLeadStatus(id, body.status);
  }

  @Get('channels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.SUPER_ADMIN)
  findChannels() {
    return this.service.findChannels();
  }

  @Post('channels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  createChannel(@Body() body: CreateChannelDto) {
    return this.service.createChannel(body);
  }

  @Patch('channels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  updateChannel(@Param('id') id: string, @Body() body: UpdateChannelDto) {
    return this.service.updateChannel(id, body);
  }
}
