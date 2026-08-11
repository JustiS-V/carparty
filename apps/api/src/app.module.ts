import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ImportModule } from './modules/import/import.module';
import { DismantleModule } from './modules/dismantle/dismantle.module';
import { ServiceModule } from './modules/service/service.module';
import { SalesModule } from './modules/sales/sales.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TasksModule } from './crm/tasks.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ImportModule,
    DismantleModule,
    ServiceModule,
    SalesModule,
    AnalyticsModule,
    TasksModule,
  ],
})
export class AppModule {}
