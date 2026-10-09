import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@/config/config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.getOrThrow('JWT_ACCESS_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        mobileNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      this.logger.warn(`JWT validated for non-existent user: ${payload.sub}`);
      throw new UnauthorizedException('User not found or has been deactivated');
    }

    if (!user.isActive) {
      this.logger.warn(`JWT used by deactivated user: ${payload.sub}`);
      throw new UnauthorizedException('User account has been deactivated');
    }

    return user;
  }
}
