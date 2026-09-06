import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { LeaveType, Role } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { LeaveService } from './leave.service';

class LeaveDto {
  @IsDateString()
  leaveDate!: string;

  @IsEnum(LeaveType)
  type!: LeaveType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsString()
  supervisorId!: string;
}

class RejectDto {
  @IsString()
  reason!: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Get('mine')
  mine(@CurrentUser() user: { id: string }) {
    return this.leave.mine(user.id);
  }

  @Get('pending')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  pending(@CurrentUser() user: { id: string }) {
    return this.leave.pending(user.id);
  }

  @Get('calendar')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  calendar(@Query('from') from?: string, @Query('to') to?: string) {
    return this.leave.calendar(from, to);
  }

  @Post()
  request(@Body() dto: LeaveDto, @CurrentUser() user: { id: string }) {
    return this.leave.request(dto, user.id);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.leave.review(id, user.id, true);
  }

  @Patch(':id/reject')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  reject(@Param('id') id: string, @Body() dto: RejectDto, @CurrentUser() user: { id: string }) {
    return this.leave.review(id, user.id, false, dto.reason);
  }
}
