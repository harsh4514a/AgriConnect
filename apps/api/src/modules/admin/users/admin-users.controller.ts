import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminUserStatusDto } from './dto/admin-user-status.dto';
import { AdminUsersService } from './admin-users.service';
import {
  AdminUserDetails,
  AdminUserFiltersResponse,
  AdminUsersResponse,
} from './interfaces/admin-users-response.interface';

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Get filter options for administrator user management' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available user filter options' })
  getFilters(): Promise<AdminUserFiltersResponse> {
    return this.service.getFilters();
  }

  @Get()
  @ApiOperation({ summary: 'List AgriConnect users for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated user list' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Admin authentication required' })
  findAll(@Query() query: AdminUserQueryDto): Promise<AdminUsersResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user detail view for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminUserDetails> {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable an AgriConnect user account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User status updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminUserStatusDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ) {
    return this.service.updateStatus(id, dto, admin);
  }
}
