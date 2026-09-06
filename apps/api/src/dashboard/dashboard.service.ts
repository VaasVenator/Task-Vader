import { Injectable } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async leaderboard() {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setUTCDate(today.getUTCDate() - today.getUTCDay() - 6);
    lastWeekStart.setUTCHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setUTCDate(lastWeekStart.getUTCDate() + 6);
    lastWeekEnd.setUTCHours(23, 59, 59, 999);

    const logs = await this.prisma.workLog.findMany({
      where: { workDate: { gte: lastWeekStart, lte: lastWeekEnd } },
      include: { task: true, user: { select: { id: true, name: true } } },
    });

    const scores = new Map<string, { userId: string; name: string; score: number }>();
    for (const log of logs) {
      const current = scores.get(log.userId) ?? { userId: log.userId, name: log.user.name, score: 0 };
      current.score += log.completedUnits * log.task.timePerUnitSeconds * log.task.complexity;
      scores.set(log.userId, current);
    }

    return [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry, index) => ({ ...entry, medal: ['gold', 'silver', 'bronze'][index] }));
  }

  async supervisor() {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);

    const workload = await this.prisma.workLog.groupBy({
      by: ['userId'],
      where: { workDate: { gte: since } },
      _sum: { totalTimeSeconds: true, completedUnits: true },
    });
    const productivity = await this.prisma.workLog.groupBy({
      by: ['taskId'],
      where: { workDate: { gte: since } },
      _sum: { totalTimeSeconds: true, completedUnits: true },
    });
    const pendingTasks = await this.prisma.task.count({ where: { status: ApprovalStatus.PENDING } });
    const pendingLeave = await this.prisma.leaveRequest.count({ where: { status: ApprovalStatus.PENDING } });
    const leaveCalendar = await this.prisma.leaveRequest.findMany({
      where: { status: ApprovalStatus.APPROVED, leaveDate: { gte: since } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { leaveDate: 'asc' },
    });
    const users = await this.prisma.user.findMany({ select: { id: true, name: true } });
    const tasks = await this.prisma.task.findMany({ select: { id: true, name: true } });

    return {
      workload: workload.map((row) => ({
        ...row,
        user: users.find((user) => user.id === row.userId),
      })),
      productivity: productivity.map((row) => ({
        ...row,
        task: tasks.find((task) => task.id === row.taskId),
      })),
      pendingApprovals: { tasks: pendingTasks, leave: pendingLeave },
      leaveCalendar,
    };
  }
}
