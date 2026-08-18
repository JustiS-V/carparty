import { Module } from '@nestjs/common';
import { BotAdminController } from './bot-admin.controller';
import { BotAdminService } from './bot-admin.service';

@Module({
  controllers: [BotAdminController],
  providers: [BotAdminService],
})
export class BotAdminModule {}
