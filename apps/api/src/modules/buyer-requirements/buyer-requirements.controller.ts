import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { BuyerRequirementsService } from './buyer-requirements.service';
import { CreateBuyerRequirementDto } from './dto/create-buyer-requirement.dto';
import { QueryBuyerRequirementsDto } from './dto/query-buyer-requirements.dto';
import { UpdateBuyerRequirementDto } from './dto/update-buyer-requirement.dto';
import {
  BuyerRequirementListResponseDto,
  BuyerRequirementResponseDto,
} from './dto/buyer-requirement-response.dto';

@ApiTags('Buyer Requirements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buyer-requirements')
export class BuyerRequirementsController {
  constructor(private readonly service: BuyerRequirementsService) {}

  @Get()
  @ApiOperation({ summary: 'Find active buyer requirements' })
  @ApiResponse({ status: HttpStatus.OK, type: BuyerRequirementListResponseDto })
  findAll(@Query() query: QueryBuyerRequirementsDto): Promise<BuyerRequirementListResponseDto> {
    return this.service.findAll(query);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Find the current user’s buyer requirements' })
  @ApiResponse({ status: HttpStatus.OK, type: [BuyerRequirementResponseDto] })
  findMine(@CurrentUser('id') userId: string): Promise<BuyerRequirementResponseDto[]> {
    return this.service.findMine(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a buyer requirement detail' })
  @ApiResponse({ status: HttpStatus.OK, type: BuyerRequirementResponseDto })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<BuyerRequirementResponseDto> {
    return this.service.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a buyer requirement' })
  @ApiResponse({ status: HttpStatus.CREATED, type: BuyerRequirementResponseDto })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBuyerRequirementDto,
  ): Promise<BuyerRequirementResponseDto> {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own buyer requirement' })
  @ApiResponse({ status: HttpStatus.OK, type: BuyerRequirementResponseDto })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBuyerRequirementDto,
  ): Promise<BuyerRequirementResponseDto> {
    return this.service.update(userId, id, dto);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close own buyer requirement' })
  @ApiResponse({ status: HttpStatus.OK })
  async close(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { status: 'cancelled' | 'fulfilled' },
  ) {
    return this.service.close(userId, id, body.status);
  }
}
