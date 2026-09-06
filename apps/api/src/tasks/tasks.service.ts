import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(status?: string) {
    return this.prisma.task.findMany({
      where: status ? { status: status as ApprovalStatus } : undefined,
      include: {
        createdBy: { select: { id: true, name: true } },
        approvalSupervisor: { select: { id: true, name: true } },
        assignments: {
          where: { removedAt: null },
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  pendingForSupervisor(supervisorId: string) {
    return this.prisma.task.findMany({
      where: { status: ApprovalStatus.PENDING, approvalSupervisorId: supervisorId },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async detail(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        approvalSupervisor: { select: { id: true, name: true } },
        assignments: {
          where: { removedAt: null },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);
    const totals = await this.prisma.workLog.aggregate({
      where: { taskId: id, workDate: { gte: since } },
      _sum: { completedUnits: true },
    });
    const activeDays = await this.prisma.workLog.groupBy({
      by: ['workDate'],
      where: { taskId: id, workDate: { gte: since } },
    });

    return {
      ...task,
      averageUnitsPerActiveDayLast30:
        activeDays.length === 0 ? 0 : (totals._sum.completedUnits ?? 0) / activeDays.length,
    };
  }

  async create(dto: { name: string; duration: number; durationUnit: string; complexity: number; approvalSupervisorId: string }, user: { id: string; role: Role }) {
    const supervisor = await this.prisma.user.findFirst({
      where: { id: dto.approvalSupervisorId, role: { in: [Role.SUPERVISOR, Role.ADMIN] } },
    });
    if (!supervisor) throw new BadRequestException('Approval supervisor not found');

    const timePerUnitSeconds = dto.durationUnit === 'MINUTES' ? dto.duration * 60 : dto.duration;
    const canApprove = user.role === Role.SUPERVISOR || user.role === Role.ADMIN;
    const autoApprove = user.id === dto.approvalSupervisorId && canApprove;
    return this.prisma.task.create({
      data: {
        name: dto.name,
        complexity: dto.complexity,
        timePerUnitSeconds,
        createdById: user.id,
        approvalSupervisorId: dto.approvalSupervisorId,
        status: autoApprove ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
        approvedAt: autoApprove ? new Date() : null,
      },
    });
  }

  async review(id: string, supervisorId: string, approved: boolean, reason?: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.approvalSupervisorId !== supervisorId) throw new ForbiddenException('Task was routed to another supervisor');
    if (!approved && !reason) throw new BadRequestException('Rejecting a task requires a reason');

    return this.prisma.task.update({
      where: { id },
      data: {
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        rejectionReason: approved ? null : reason,
        approvedAt: approved ? new Date() : null,
      },
    });
  }
}
