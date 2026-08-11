import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { TrackEventPayload, AnalyticsQueryParams } from '@carparty/types';
import { UserRole } from '@carparty/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetricDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(payload: TrackEventPayload) {
    const definition = await this.prisma.client.metricDefinition.findUnique({
      where: { key: payload.metric },
    });

    if (!definition?.isActive) {
      return { skipped: true, reason: 'metric not found or inactive' };
    }

    const event = await this.prisma.client.analyticsEvent.create({
      data: {
        metricKey: payload.metric,
        value: payload.value ?? 1,
        dimensions: payload.dimensions ?? {},
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      },
    });

    return { ok: true, id: event.id };
  }

  async trackBatch(events: TrackEventPayload[]) {
    const results = await Promise.all(events.map((e) => this.track(e)));
    return { processed: results.length, results };
  }

  getMetrics(module?: string) {
    return this.prisma.client.metricDefinition.findMany({
      where: {
        isActive: true,
        ...(module ? { module } : {}),
      },
      orderBy: { key: 'asc' },
    });
  }

  registerMetric(dto: CreateMetricDto) {
    return this.prisma.client.metricDefinition.create({
      data: {
        key: dto.key,
        label: dto.label,
        type: dto.type,
        aggregation: dto.aggregation,
        dimensions: dto.dimensions ?? [],
        chartType: dto.chartType ?? 'line',
        module: dto.module,
      },
    });
  }

  updateMetric(key: string, dto: Partial<CreateMetricDto>) {
    return this.prisma.client.metricDefinition.update({
      where: { key },
      data: {
        label: dto.label,
        type: dto.type,
        aggregation: dto.aggregation,
        dimensions: dto.dimensions,
        chartType: dto.chartType,
        module: dto.module,
      },
    });
  }

  deactivateMetric(key: string) {
    return this.prisma.client.metricDefinition.update({
      where: { key },
      data: { isActive: false },
    });
  }

  async query(params: AnalyticsQueryParams) {
    const definition = await this.prisma.client.metricDefinition.findUnique({
      where: { key: params.metric },
    });

    if (!definition) {
      return { metric: params.metric, label: params.metric, data: [], total: 0, chartType: 'line' as const };
    }

    const { from, to } = this.resolvePeriod(params);
    const groupBy = params.groupBy ?? 'day';

    const aggregates = await this.prisma.client.analyticsAggregate.findMany({
      where: {
        metricKey: params.metric,
        granularity: groupBy,
        period: { gte: this.formatPeriod(from, groupBy), lte: this.formatPeriod(to, groupBy) },
      },
      orderBy: { period: 'asc' },
    });

    if (aggregates.length > 0) {
      const data = aggregates.map((a) => ({
        period: a.period,
        value: a.value,
        dimensions: a.dimensions as Record<string, string>,
      }));
      return {
        metric: params.metric,
        label: definition.label,
        chartType: definition.chartType,
        data,
        total: data.reduce((sum, d) => sum + d.value, 0),
      };
    }

    const events = await this.prisma.client.analyticsEvent.findMany({
      where: {
        metricKey: params.metric,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: 'asc' },
    });

    const grouped = this.groupEvents(events, groupBy);
    const data = Object.entries(grouped).map(([period, items]) => ({
      period,
      value: this.aggregateValues(items.map((i) => i.value), definition.aggregation),
    }));

    return {
      metric: params.metric,
      label: definition.label,
      chartType: definition.chartType,
      data,
      total: data.reduce((sum, d) => sum + d.value, 0),
    };
  }

  getDashboards(role?: UserRole) {
    return this.prisma.client.dashboard.findMany({
      where: role ? { role } : undefined,
      include: { widgets: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createDashboard(body: {
    name: string;
    role: UserRole;
    module?: string;
    widgets?: Array<{
      metricKey: string;
      chartType: string;
      title: string;
      position?: object;
    }>;
  }) {
    return this.prisma.client.dashboard.create({
      data: {
        name: body.name,
        role: body.role,
        module: body.module as never,
        createdBy: 'system',
        widgets: body.widgets
          ? {
              create: body.widgets.map((w) => ({
                metricKey: w.metricKey,
                chartType: w.chartType,
                title: w.title,
                position: w.position ?? { x: 0, y: 0, w: 4, h: 2 },
              })),
            }
          : undefined,
      },
      include: { widgets: true },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async aggregateRecentEvents() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const events = await this.prisma.client.analyticsEvent.findMany({
      where: { timestamp: { gte: since } },
    });

    const definitions = await this.prisma.client.metricDefinition.findMany({
      where: { isActive: true },
    });
    const defMap = new Map(definitions.map((d) => [d.key, d]));

    const buckets = new Map<string, { values: number[]; count: number; dimensions: object }>();

    for (const event of events) {
      for (const granularity of ['hour', 'day'] as const) {
        const period = this.formatPeriod(event.timestamp, granularity);
        const key = `${event.metricKey}|${period}|${granularity}|${JSON.stringify(event.dimensions)}`;

        const existing = buckets.get(key) ?? {
          values: [],
          count: 0,
          dimensions: event.dimensions as object,
        };
        existing.values.push(event.value);
        existing.count += 1;
        buckets.set(key, existing);
      }
    }

    for (const [key, bucket] of buckets) {
      const [metricKey, period, granularity] = key.split('|');
      const definition = defMap.get(metricKey);
      if (!definition) continue;

      const value = this.aggregateValues(bucket.values, definition.aggregation);
      const dimensionsKey = JSON.stringify(bucket.dimensions);

      await this.prisma.client.analyticsAggregate.upsert({
        where: {
          metricKey_period_granularity_dimensionsKey: {
            metricKey,
            period,
            granularity,
            dimensionsKey,
          },
        },
        update: { value, count: bucket.count },
        create: {
          metricKey,
          period,
          granularity,
          dimensionsKey,
          value,
          count: bucket.count,
          dimensions: bucket.dimensions,
        },
      });
    }
  }

  private resolvePeriod(params: AnalyticsQueryParams) {
    const now = new Date();
    let from: Date;
    let to = now;

    switch (params.period) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last_7_days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        from = params.from ? new Date(params.from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        to = params.to ? new Date(params.to) : now;
        break;
      case 'last_30_days':
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { from, to };
  }

  private formatPeriod(date: Date, granularity: string): string {
    const d = new Date(date);
    switch (granularity) {
      case 'hour':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}`;
      case 'week':
        return `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'day':
      default:
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }

  private groupEvents(
    events: Array<{ timestamp: Date; value: number; dimensions: unknown }>,
    groupBy: string,
  ) {
    const grouped: Record<string, Array<{ value: number }>> = {};
    for (const event of events) {
      const period = this.formatPeriod(event.timestamp, groupBy);
      grouped[period] ??= [];
      grouped[period].push({ value: event.value });
    }
    return grouped;
  }

  private aggregateValues(values: number[], aggregation: string): number {
    if (values.length === 0) return 0;
    switch (aggregation) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'count':
        return values.length;
      case 'sum':
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  }
}
