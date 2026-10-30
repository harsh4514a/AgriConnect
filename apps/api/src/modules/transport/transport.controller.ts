import {
  Body,
  Controller,
  Delete,
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

import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../authentication/guards/optional-jwt-auth.guard';
import { UpdateTransportAvailabilityDto } from './dto/availability.dto';
import { CreateTransportDto } from './dto/create-transport.dto';
import { QueryTransportDto } from './dto/query-transport.dto';
import { TransportListResponseDto, TransportProviderResponseDto } from './dto/transport-response.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { TransportService } from './transport.service';

@ApiTags('Transport')
@Controller('transport')
export class TransportController {
  constructor(private readonly service: TransportService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Publicly browse active agricultural transport services' })
  @ApiResponse({ status: HttpStatus.OK, type: TransportListResponseDto })
  findAll(
    @CurrentUser('id') userId: string | null,
    @Query() query: QueryTransportDto,
  ): Promise<TransportListResponseDto> {
    return this.service.findAll(query, Boolean(userId));
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the authenticated user transport services' })
  @ApiResponse({ status: HttpStatus.OK, type: TransportListResponseDto })
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryTransportDto,
  ): Promise<TransportListResponseDto> {
    return this.service.findMine(userId, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get an active transport service; contact details require sign-in' })
  @ApiResponse({ status: HttpStatus.OK, type: TransportProviderResponseDto })
  findOne(
    @CurrentUser('id') userId: string | null,
    @Param('id') id: string,
  ): Promise<TransportProviderResponseDto> {
    return this.service.findOne(id, Boolean(userId));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a transport service for the authenticated user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TransportProviderResponseDto })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTransportDto,
  ): Promise<TransportProviderResponseDto> {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the authenticated user transport service' })
  @ApiResponse({ status: HttpStatus.OK, type: TransportProviderResponseDto })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransportDto,
  ): Promise<TransportProviderResponseDto> {
    return this.service.update(userId, id, dto);
  }

  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update availability of the authenticated user transport service' })
  @ApiResponse({ status: HttpStatus.OK, type: TransportProviderResponseDto })
  updateAvailability(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransportAvailabilityDto,
  ): Promise<TransportProviderResponseDto> {
    return this.service.updateAvailability(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete the authenticated user transport service' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transport service deleted' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.service.remove(userId, id);
  }
}
