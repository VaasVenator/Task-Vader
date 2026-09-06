import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentType } from '@prisma/client';
import { daysBetween, isFutureDate, isWeekend, toDateOnly } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) {}

  mine(userId: string, from?: string, to?: string) {
    return this.prisma.workLog.findMany({
      where: {
        userId,
        workDate: {
          gte: from ? toDateOnly(from) : undefined,
          lte: to ? toDateOnly(to) : undefined,
        },
      },
      include: { task: true },
      orderBy: { workDate: 'desc' },
    });
  }

  all(from?: string, to?: string) {
    return this.prisma.workLog.findMany({
      where: {
        workDate: {
          gte: from ? toDateOnly(from) : undefined,
          lte: to ? toDateOnly(to) : undefined,
        },
      },
      include: { task: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { workDate: 'desc' },
    });
  }

  assignedTasks(userId: string, acting = false) {
    return this.prisma.assignment.findMany({
      where: {
        userId,
        removedAt: null,
        type: acting ? AssignmentType.ACTING : AssignmentType.PERMANENT,
        task: { status: 'APPROVED' },
      },
      include: { task: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async upsert(dto: { taskId: string; workDate: string; completedUnits: number }, userId: string) {
    const workDate = toDateOnly(dto.workDate);
    if (isFutureDate(workDate)) throw new BadRequestException('Future dates cannot be updated');
    if (daysBetween(workDate, new Date()) > 10) {
      throw new BadRequestException('Past records can be edited only within 10 days after submission');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: { taskId: dto.taskId, userId, removedAt: null },
      include: { task: true },
    });
    if (!assignment) throw new ForbiddenException('Task is not assigned to this user');

    const task = assignment.task;
    return this.prisma.workLog.upsert({
      where: { taskId_userId_workDate: { taskId: dto.taskId, userId, workDate } },
      update: {
        completedUnits: dto.completedUnits,
        totalTimeSeconds: dto.completedUnits * task.timePerUnitSeconds,
      },
      create: {
        taskId: dto.taskId,
        userId,
        workDate,
        completedUnits: dto.completedUnits,
        totalTimeSeconds: dto.completedUnits * task.timePerUnitSeconds,
      },
    });
  }

  async warning(userId: string) {
    const today = toDateOnly(new Date());
    let missed = 0;

    for (let offset = 1; offset <= 30; offset += 1) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - offset);
      if (isWeekend(date)) continue;
      const holiday = await this.prisma.holiday.findUnique({ where: { date } });
      if (holiday) continue;
      const leave = await this.prisma.leaveRequest.findUnique({ where: { userId_leaveDate: { userId, leaveDate: date } } });
      if (leave?.status === 'APPROVED') continue;
      const count = await this.prisma.workLog.count({ where: { userId, workDate: date } });
      if (count === 0) missed += 1;
      else break;
      if (missed >= 10) break;
    }

    return { missedWorkingDaysInARow: missed, warning: missed >= 10 };
  }
}
