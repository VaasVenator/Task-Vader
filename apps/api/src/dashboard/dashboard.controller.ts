import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('leaderboard')
  leaderboard() {
    return this.dashboard.leaderboard();
  }

  @Get('supervisor')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  supervisor() {
    return this.dashboard.supervisor();
  }
}
