import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import {
  AdminAuthResponse,
  AdminProfileResponse,
} from './interfaces/admin-auth-response.interface';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { AdminPublic } from './decorators/admin-public.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';

@ApiTags('Admin Authentication')
@Controller('admin/auth')
@UseGuards(AdminJwtAuthGuard)
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @AdminPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate administrator with username and password',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin login successful, tokens returned',
  })
  @ApiResponse({ status: 401, description: 'Invalid username or password' })
  @ApiResponse({
    status: 429,
    description: 'Too many failed login attempts, lockout active',
  })
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
  ): Promise<AdminAuthResponse> {
    // Do not trust X-Forwarded-For unless a trusted proxy has been configured.
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    return this.adminAuthService.login(dto, ip, userAgent);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated administrator profile',
  })
  @ApiResponse({ status: 200, description: 'Admin profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async profile(
    @CurrentAdmin('id') adminId: string,
  ): Promise<AdminProfileResponse> {
    return this.adminAuthService.getProfile(adminId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout administrator and invalidate session tokens',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentAdmin('id') adminId: string,
    @Body() dto?: AdminRefreshDto,
  ): Promise<{ message: string }> {
    return this.adminAuthService.logout(adminId, dto?.refreshToken);
  }

  @AdminPublic()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh administrator access token using valid refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Fresh token pair issued successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired admin refresh token',
  })
  async refresh(
    @Body() dto: AdminRefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.adminAuthService.refresh(dto);
  }
}
