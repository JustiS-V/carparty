import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UserRole } from '@carparty/database';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
      include: { workerPermissions: true },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.signToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.workerPermissions,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.client.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: UserRole.CLIENT,
        clientProfile: { create: {} },
      },
    });

    const token = this.signToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { workerPermissions: true, clientProfile: true },
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.workerPermissions,
      clientProfile: user.clientProfile,
    };
  }

  private signToken(sub: string, email: string, role: UserRole) {
    return this.jwt.sign({ sub, email, role });
  }
}
