import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import type { BotPlan } from '@carparty/types';

export class ActivateSubscriberDto {
  @IsEnum(['FREE', 'BASIC', 'PRO'])
  plan!: BotPlan;

  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}
