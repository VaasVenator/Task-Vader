import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, AssignmentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(dto: { taskId: string; userId: string; type: AssignmentType }, supervisorId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
      include: { assignments: { where: { removedAt: null } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== ApprovalStatus.APPROVED) throw new BadRequestException('Only approved tasks can be assigned');

    const permanent = task.assignments.find((assignment) => assignment.type === AssignmentType.PERMANENT);
    if (dto.type === AssignmentType.PERMANENT && permanent && permanent.userId !== dto.userId) {
      throw new BadRequestException('A task can have only one permanent owner');
    }
    if (dto.type === AssignmentType.ACTING && permanent?.userId === dto.userId) {
      throw new BadRequestException('Permanent owner cannot also be an acting owner');
    }
    if (dto.type === AssignmentType.ACTING) {
      const actingCount = task.assignments.filter((assignment) => assignment.type === AssignmentType.ACTING).length;
      if (actingCount >= 5) throw new BadRequestException('A task can have a maximum of 5 acting staff members');
    }

    const duplicate = task.assignments.find(
      (assignment) => assignment.userId === dto.userId && assignment.type === dto.type,
    );
    if (duplicate) return duplicate;

    return this.prisma.assignment.create({
      data: {
        taskId: dto.taskId,
        userId: dto.userId,
        type: dto.type,
        assignedById: supervisorId,
      },
    });
  }

  async remove(id: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment || assignment.removedAt) throw new NotFoundException('Assignment not found');
    return this.prisma.assignment.update({ where: { id }, data: { removedAt: new Date() } });
  }
}
