import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@carparty/database';
import { buildContentHash, parseListing } from '@carparty/parsers';
import type { ExternalSource, IngestPayload } from '@carparty/types';
import { AnalyticsService } from '../../analytics/analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChannelDto, IngestLeadDto, UpdateChannelDto } from './dto/collectors.dto';

@Injectable()
export class CollectorsService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  findLeads(filters?: { source?: ExternalSource; status?: LeadStatus }) {
    return this.prisma.client.externalLead.findMany({
      where: {
        ...(filters?.source ? { source: filters.source } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: { channel: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  findLead(id: string) {
    return this.prisma.client.externalLead.findUnique({
      where: { id },
      include: { channel: true },
    });
  }

  findChannels() {
    return this.prisma.client.sourceChannel.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { leads: true } },
      },
    });
  }

  createChannel(dto: CreateChannelDto) {
    return this.prisma.client.sourceChannel.create({
      data: {
        source: dto.source,
        externalId: dto.externalId,
        name: dto.name,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  updateChannel(id: string, dto: UpdateChannelDto) {
    return this.prisma.client.sourceChannel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.config !== undefined ? { config: dto.config as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async ingest(dto: IngestLeadDto) {
    const payload: IngestPayload = {
      source: dto.source,
      externalId: dto.externalId,
      rawText: dto.rawText,
      sourceUrl: dto.sourceUrl,
      channelExternalId: dto.channelExternalId,
      channelName: dto.channelName,
      mediaUrls: dto.mediaUrls,
      metadata: dto.metadata,
      postedAt: dto.postedAt,
    };

    const contentHash = buildContentHash(payload);
    const existing = await this.prisma.client.externalLead.findUnique({
      where: { contentHash },
    });

    if (existing) {
      await this.trackIngest(dto.source, 'duplicate');
      return { lead: existing, duplicate: true };
    }

    const duplicateByExternal = await this.prisma.client.externalLead.findUnique({
      where: {
        source_externalId: {
          source: dto.source,
          externalId: dto.externalId,
        },
      },
    });

    if (duplicateByExternal) {
      await this.trackIngest(dto.source, 'duplicate');
      return { lead: duplicateByExternal, duplicate: true };
    }

    const channel = await this.ensureChannel(dto);
    const parsed = parseListing(dto.source, dto.rawText);
    const status = parsed.isCarListing ? LeadStatus.PARSED : LeadStatus.REVIEW;

    const lead = await this.prisma.client.externalLead.create({
      data: {
        source: dto.source,
        externalId: dto.externalId,
        channelId: channel?.id,
        sourceUrl: dto.sourceUrl,
        rawText: dto.rawText,
        description: parsed.description,
        price: parsed.price ?? undefined,
        currency: parsed.currency ?? undefined,
        make: parsed.make ?? undefined,
        model: parsed.model ?? undefined,
        year: parsed.year ?? undefined,
        region: parsed.region ?? undefined,
        market: 'UA',
        links: parsed.links,
        mediaUrls: [...new Set([...(dto.mediaUrls ?? []), ...parsed.mediaUrls])],
        status,
        parsedAt: new Date(),
        contentHash,
        metadata: {
          ...(dto.metadata ?? {}),
          parsed: parsed.metadata,
          postedAt: dto.postedAt,
        } as Prisma.InputJsonValue,
      },
      include: { channel: true },
    });

    if (channel) {
      await this.prisma.client.sourceChannel.update({
        where: { id: channel.id },
        data: { lastSyncAt: new Date() },
      });
    }

    await this.trackIngest(dto.source, status === LeadStatus.PARSED ? 'parsed' : 'review');

    if (dto.source === 'TELEGRAM') {
      await this.analytics.track({
        metric: 'sales.telegram_leads',
        value: 1,
        dimensions: { channel_id: dto.channelExternalId ?? 'unknown' },
      });
    }

    return { lead, duplicate: false };
  }

  async updateLeadStatus(id: string, status: LeadStatus) {
    const lead = await this.prisma.client.externalLead.update({
      where: { id },
      data: { status },
      include: { channel: true },
    });

    if (status === LeadStatus.PROMOTED) {
      await this.analytics.track({
        metric: 'leads.promoted',
        value: 1,
        dimensions: { source: lead.source },
      });
    }

    return lead;
  }

  private async ensureChannel(dto: IngestLeadDto) {
    if (!dto.channelExternalId) return null;

    return this.prisma.client.sourceChannel.upsert({
      where: {
        source_externalId: {
          source: dto.source,
          externalId: dto.channelExternalId,
        },
      },
      update: {
        ...(dto.channelName ? { name: dto.channelName } : {}),
        lastSyncAt: new Date(),
      },
      create: {
        source: dto.source,
        externalId: dto.channelExternalId,
        name: dto.channelName ?? dto.channelExternalId,
      },
    });
  }

  private async trackIngest(source: ExternalSource, outcome: string) {
    await this.analytics.track({
      metric: 'leads.ingested',
      value: 1,
      dimensions: { source, outcome },
    });
  }
}
