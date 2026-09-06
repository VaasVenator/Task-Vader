import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsDateString, IsInt, IsString, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WorkLogsService } from './work-logs.service';

class UpsertWorkLogDto {
  @IsString()
  taskId!: string;

  @IsDateString()
  workDate!: string;

  @IsInt()
  @Min(0)
  completedUnits!: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-logs')
export class WorkLogsController {
  constructor(private readonly logs: WorkLogsService) {}

  @Get('mine')
  mine(@CurrentUser() user: { id: string }, @Query('from') from?: string, @Query('to') to?: string) {
    return this.logs.mine(user.id, from, to);
  }

  @Get()
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  all(@Query('from') from?: string, @Query('to') to?: string) {
    return this.logs.all(from, to);
  }

  @Get('assigned')
  assigned(@CurrentUser() user: { id: string }, @Query('acting') acting?: string) {
    return this.logs.assignedTasks(user.id, acting === 'true');
  }

  @Get('warning')
  warning(@CurrentUser() user: { id: string }) {
    return this.logs.warning(user.id);
  }

  @Post()
  upsert(@Body() dto: UpsertWorkLogDto, @CurrentUser() user: { id: string }) {
    return this.logs.upsert(dto, user.id);
  }
}
