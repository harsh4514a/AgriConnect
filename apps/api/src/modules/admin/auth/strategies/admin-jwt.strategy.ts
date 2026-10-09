import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@/config/config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminJwtPayload } from '../interfaces/admin-jwt-payload.interface';
import { AdminProfileResponse } from '../interfaces/admin-auth-response.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  private readonly logger = new Logger(AdminJwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      configService.getOrThrow('JWT_ADMIN_ACCESS_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminProfileResponse> {
    if (payload.type !== 'admin' || payload.role !== 'admin' || !payload.sub) {
      this.logger.warn('Invalid admin token claims.');
      throw new UnauthorizedException('Access denied: invalid admin token');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!admin) {
      this.logger.warn('Admin JWT references a non-existent administrator.');
      throw new UnauthorizedException('Admin account not found');
    }

    if (!admin.isActive) {
      this.logger.warn('An inactive administrator attempted to use an admin token.');
      throw new UnauthorizedException('Admin account has been deactivated');
    }

    return {
      id: admin.id,
      username: admin.username,
      role: 'admin',
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
  }
}
