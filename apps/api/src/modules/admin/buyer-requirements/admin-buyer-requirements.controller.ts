import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { AdminBuyerRequirementQueryDto } from './dto/admin-buyer-requirement-query.dto';
import { AdminBuyerRequirementsService } from './admin-buyer-requirements.service';
import {
  AdminBuyerRequirementDetails,
  AdminBuyerRequirementFiltersResponse,
  AdminBuyerRequirementsResponse,
} from './interfaces/admin-buyer-requirements-response.interface';

@ApiTags('Admin Buyer Requirements')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/buyer-requirements')
export class AdminBuyerRequirementsController {
  constructor(private readonly service: AdminBuyerRequirementsService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Get buyer requirement filter options for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available filter options' })
  getFilters(): Promise<AdminBuyerRequirementFiltersResponse> {
    return this.service.getFilters();
  }

  @Get()
  @ApiOperation({ summary: 'List buyer requirements for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated buyer requirements' })
  findAll(@Query() query: AdminBuyerRequirementQueryDto): Promise<AdminBuyerRequirementsResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a buyer requirement detail for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Buyer requirement details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Buyer requirement not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminBuyerRequirementDetails> {
    return this.service.findOne(id);
  }
}
