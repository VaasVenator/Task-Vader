import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, supervisorId: true },
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
    });
  }

  supervisors() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: { in: [Role.SUPERVISOR, Role.ADMIN] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: { name: string; email: string; password: string; role: Role; supervisorId?: string }, creatorId: string) {
    if (dto.role === Role.STAFF && !dto.supervisorId) {
      dto.supervisorId = creatorId;
    }
    if (dto.supervisorId) {
      const supervisor = await this.prisma.user.findFirst({
        where: { id: dto.supervisorId, role: { in: [Role.SUPERVISOR, Role.ADMIN] } },
      });
      if (!supervisor) throw new BadRequestException('Supervisor not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password, ...userData } = dto;
    return this.prisma.user.create({
      data: { ...userData, passwordHash },
      select: { id: true, name: true, email: true, role: true, supervisorId: true },
    });
  }
}
