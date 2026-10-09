import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { AdminAuditQueryDto } from './dto/admin-audit-query.dto';
import { AdminAuditService } from './admin-audit.service';
import {
  AdminAuditDetails,
  AdminAuditFiltersResponse,
  AdminAuditResponse,
} from './interfaces/admin-audit.interface';

@ApiTags('Admin Audit')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/audit')
export class AdminAuditController {
  constructor(private readonly service: AdminAuditService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Get filter options for Activity & Audit logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available audit filter options' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Admin authentication required' })
  getFilters(): Promise<AdminAuditFiltersResponse> {
    return this.service.getFilters();
  }

  @Get()
  @ApiOperation({ summary: 'List and filter system and administrative audit logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated audit logs list' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Admin authentication required' })
  findAll(@Query() query: AdminAuditQueryDto): Promise<AdminAuditResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full details of a specific audit log record' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit log details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Audit record not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Admin authentication required' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminAuditDetails> {
    return this.service.findOne(id);
  }
}
