import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { AssignmentType, Role } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignmentsService } from './assignments.service';

class AssignDto {
  @IsString()
  taskId!: string;

  @IsString()
  userId!: string;

  @IsEnum(AssignmentType)
  type!: AssignmentType;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERVISOR, Role.ADMIN)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Post()
  assign(@Body() dto: AssignDto, @CurrentUser() user: { id: string }) {
    return this.assignments.assign(dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assignments.remove(id);
  }
}
