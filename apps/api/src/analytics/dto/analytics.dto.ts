import { IsIn, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import type { Aggregation, ChartType, MetricType } from '@carparty/types';

export class CreateMetricDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsIn(['counter', 'gauge', 'histogram', 'rate'])
  type!: MetricType;

  @IsIn(['sum', 'count', 'avg', 'max', 'min', 'unique'])
  aggregation!: Aggregation;

  @IsOptional()
  dimensions?: string[];

  @IsOptional()
  @IsIn(['line', 'bar', 'pie', 'area', 'number', 'table'])
  chartType?: ChartType;

  @IsOptional()
  @IsString()
  module?: string;
}

export class QueryAnalyticsDto {
  @IsString()
  metric!: string;

  @IsOptional()
  @IsIn(['today', 'last_7_days', 'last_30_days', 'last_90_days', 'custom'])
  period?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsIn(['hour', 'day', 'week', 'month'])
  groupBy?: string;

  @IsOptional()
  @IsObject()
  dimensions?: Record<string, string>;
}

export class TrackBatchDto {
  @IsObject({ each: true })
  events!: Array<{ metric: string; value?: number; dimensions?: Record<string, unknown> }>;
}
