export type UserRole = 'CLIENT' | 'WORKER' | 'SUPER_ADMIN';

export type CrmModule = 'IMPORT' | 'DISMANTLE' | 'SERVICE' | 'SALES';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'rate';

export type Aggregation = 'sum' | 'count' | 'avg' | 'max' | 'min' | 'unique';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'number' | 'table';

export interface MetricDefinition {
  key: string;
  label: string;
  type: MetricType;
  aggregation: Aggregation;
  dimensions?: string[];
  chartType?: ChartType;
  module?: CrmModule | 'global';
}

export interface TrackEventPayload {
  metric: string;
  value?: number;
  dimensions?: Record<string, string | number | boolean>;
  timestamp?: string;
}

export interface AnalyticsQueryParams {
  metric: string;
  period?: 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  from?: string;
  to?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  dimensions?: Record<string, string>;
}

export interface AnalyticsDataPoint {
  period: string;
  value: number;
  dimensions?: Record<string, string>;
}

export interface AnalyticsQueryResult {
  metric: string;
  label: string;
  chartType: ChartType;
  data: AnalyticsDataPoint[];
  total: number;
}

export interface WidgetConfig {
  id?: string;
  metricKey: string;
  chartType: ChartType;
  title: string;
  filters?: Record<string, string>;
  position?: { x: number; y: number; w: number; h: number };
  refreshRate?: number;
}

export interface DashboardConfig {
  id?: string;
  name: string;
  role: UserRole;
  module?: CrmModule;
  isDefault?: boolean;
  widgets: WidgetConfig[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: WorkerPermission[];
}

export interface WorkerPermission {
  module: CrmModule;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ExternalSource =
  | 'TELEGRAM'
  | 'THREADS'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'MARKETPLACE'
  | 'AUTO_RIA'
  | 'OLX_UA'
  | 'OTHER';

export type BotPlan = 'FREE' | 'BASIC' | 'PRO';

export interface SubscriberFilters {
  makes?: string[];
  maxPrice?: number;
  minYear?: number;
  regions?: string[];
  keywords?: string[];
}

export type LeadStatus =
  | 'NEW'
  | 'PARSED'
  | 'REVIEW'
  | 'PROMOTED'
  | 'REJECTED'
  | 'DUPLICATE';

export interface ParsedListing {
  description: string | null;
  price: number | null;
  currency: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  region: string | null;
  links: string[];
  mediaUrls: string[];
  isCarListing: boolean;
  metadata: Record<string, unknown>;
}

export interface IngestPayload {
  source: ExternalSource;
  externalId: string;
  rawText: string;
  sourceUrl?: string;
  channelExternalId?: string;
  channelName?: string;
  mediaUrls?: string[];
  metadata?: Record<string, unknown>;
  postedAt?: string;
}
