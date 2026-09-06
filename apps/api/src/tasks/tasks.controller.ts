import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TasksService } from './tasks.service';

enum TimeUnit {
  SECONDS = 'SECONDS',
  MINUTES = 'MINUTES',
}

class CreateTaskDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  duration!: number;

  @IsEnum(TimeUnit)
  durationUnit!: TimeUnit;

  @IsInt()
  @Min(1)
  @Max(5)
  complexity!: number;

  @IsString()
  approvalSupervisorId!: string;
}

class ReviewTaskDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.tasks.list(status);
  }

  @Get('pending')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  pending(@CurrentUser() user: { id: string }) {
    return this.tasks.pendingForSupervisor(user.id);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.tasks.detail(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { id: string; role: Role }) {
    return this.tasks.create(dto, user);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.tasks.review(id, user.id, true);
  }

  @Patch(':id/reject')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  reject(@Param('id') id: string, @Body() dto: ReviewTaskDto, @CurrentUser() user: { id: string }) {
    return this.tasks.review(id, user.id, false, dto.reason);
  }
}
