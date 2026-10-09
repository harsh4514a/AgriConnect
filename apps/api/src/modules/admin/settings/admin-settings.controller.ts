import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AdminSettingsService, AdminSettingsInfo } from './admin-settings.service';
import { AdminChangePasswordDto } from '../auth/dto/admin-change-password.dto';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  /**
   * GET /admin/settings/info
   * Returns non-sensitive system, profile, and market-price info.
   * Farmer/user JWTs are rejected by AdminJwtAuthGuard.
   */
  @Get('info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get non-sensitive admin settings and system info' })
  @ApiResponse({ status: 200, description: 'Settings info returned successfully' })
  @ApiResponse({ status: 401, description: 'Admin authentication required' })
  getInfo(
    @CurrentAdmin('id') adminId: string,
  ): Promise<AdminSettingsInfo> {
    return this.settingsService.getSettingsInfo(adminId);
  }

  /**
   * PATCH /admin/settings/security/password
   * Securely changes admin password. Verifies current password,
   * hashes new password, revokes all sessions, records audit event.
   * Farmer/user JWTs are rejected by AdminJwtAuthGuard.
   */
  @Patch('security/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change administrator password with current password verification' })
  @ApiResponse({ status: 200, description: 'Password changed successfully, sessions revoked' })
  @ApiResponse({ status: 400, description: 'Validation error or passwords do not match' })
  @ApiResponse({ status: 401, description: 'Admin authentication required or current password incorrect' })
  changePassword(
    @CurrentAdmin('id') adminId: string,
    @Body() dto: AdminChangePasswordDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    return this.settingsService.changePassword(adminId, dto, ip, userAgent);
  }
}
