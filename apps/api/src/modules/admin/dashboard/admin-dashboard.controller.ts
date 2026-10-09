import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardResponse } from './interfaces/admin-dashboard-response.interface';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get authenticated administrator dashboard overview',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics and recent activity',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  getOverview(): Promise<AdminDashboardResponse> {
    return this.service.getOverview();
  }
}
