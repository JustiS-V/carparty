import { IsArray, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import type { ExternalSource, LeadStatus } from '@carparty/types';

export class IngestLeadDto {
  @IsEnum(['TELEGRAM', 'THREADS', 'INSTAGRAM', 'FACEBOOK', 'MARKETPLACE', 'AUTO_RIA', 'OLX_UA', 'OTHER'])
  source!: ExternalSource;

  @IsString()
  @MinLength(1)
  externalId!: string;

  @IsString()
  @MinLength(1)
  rawText!: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  channelExternalId?: string;

  @IsOptional()
  @IsString()
  channelName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  postedAt?: string;
}

export class CreateChannelDto {
  @IsEnum(['TELEGRAM', 'THREADS', 'INSTAGRAM', 'FACEBOOK', 'MARKETPLACE', 'AUTO_RIA', 'OLX_UA', 'OTHER'])
  source!: ExternalSource;

  @IsString()
  @MinLength(1)
  externalId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateLeadStatusDto {
  @IsEnum(['NEW', 'PARSED', 'REVIEW', 'PROMOTED', 'REJECTED', 'DUPLICATE'])
  status!: LeadStatus;
}

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
