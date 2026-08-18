import { IsEnum, IsString, MinLength } from 'class-validator';
import type { BotPlan } from '@carparty/types';

export class CreatePaymentDto {
  @IsString()
  @MinLength(1)
  telegramId!: string;

  @IsEnum(['BASIC', 'PRO'])
  plan!: BotPlan;
}
