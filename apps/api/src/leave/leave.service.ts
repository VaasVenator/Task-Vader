import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, LeaveType, Role } from '@prisma/client';
import { toDateOnly } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  mine(userId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { userId },
      include: { supervisor: { select: { id: true, name: true } } },
      orderBy: { leaveDate: 'desc' },
    });
  }

  pending(supervisorId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { supervisorId, status: ApprovalStatus.PENDING },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { leaveDate: 'asc' },
    });
  }

  calendar(from?: string, to?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        leaveDate: {
          gte: from ? toDateOnly(from) : undefined,
          lte: to ? toDateOnly(to) : undefined,
        },
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { leaveDate: 'asc' },
    });
  }

  async request(dto: { leaveDate: string; type: LeaveType; reason?: string; supervisorId: string }, userId: string) {
    const leaveDate = toDateOnly(dto.leaveDate);
    const supervisor = await this.prisma.user.findFirst({
      where: { id: dto.supervisorId, role: { in: [Role.SUPERVISOR, Role.ADMIN] } },
    });
    if (!supervisor) throw new BadRequestException('Supervisor not found');

    return this.prisma.leaveRequest.upsert({
      where: { userId_leaveDate: { userId, leaveDate } },
      update: {
        type: dto.type,
        reason: dto.reason,
        supervisorId: dto.supervisorId,
        status: ApprovalStatus.PENDING,
      },
      create: {
        userId,
        leaveDate,
        type: dto.type,
        reason: dto.reason,
        supervisorId: dto.supervisorId,
      },
    });
  }

  async review(id: string, supervisorId: string, approved: boolean, reason?: string) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.supervisorId !== supervisorId) throw new ForbiddenException('Leave request was routed to another supervisor');
    if (!approved && !reason) throw new BadRequestException('Rejecting leave requires a reason');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        rejectionReason: approved ? null : reason,
        reviewedAt: new Date(),
      },
    });
  }
}
