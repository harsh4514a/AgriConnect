import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { QueryListingsDto } from './dto/query-listings.dto';
import { ListingResponseDto, PaginatedListingsDto } from './dto/listing-response.dto';
import { RecentListingResponseDto } from './dto/recent-listing-response.dto';
import { QueryMyListingsManagementDto } from './dto/query-my-listings-management.dto';
import { MyListingsManagementResponseDto } from './dto/my-listings-management-response.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../authentication/guards/optional-jwt-auth.guard';
import { NearbyListingsQueryDto } from './dto/nearby-listings.dto';
import { ListingImagesService } from './listing-images.service';

const MAX_LISTING_IMAGES = 5;
const MAX_LISTING_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly listingImages: ListingImagesService,
  ) {}

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', MAX_LISTING_IMAGES, {
      limits: { fileSize: MAX_LISTING_IMAGE_SIZE, files: MAX_LISTING_IMAGES },
      fileFilter: (_request, file, callback) => {
        if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException('Only JPEG, PNG, and WebP images are supported'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload marketplace listing images to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['images'],
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Cloudinary image URLs' })
  uploadImages(
    @CurrentUser('id') userId: string,
    @UploadedFiles()
    files: Array<{ buffer: Buffer; mimetype: string; originalname: string }>,
  ): Promise<{ urls: string[] }> {
    return this.listingImages.upload(userId, files).then((urls) => ({ urls }));
  }

  /**
   * GET /listings
   * Public — no auth required.
   * Returns paginated listings, optionally filtered by cropKey, district, status.
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all marketplace listings (paginated, filterable)' })
  @ApiResponse({ status: 200, type: PaginatedListingsDto })
  findAll(
    @Query() query: QueryListingsDto,
    @CurrentUser('id') userId: string | null,
  ): Promise<PaginatedListingsDto> {
    return this.listingsService.findAll(query, userId);
  }

  /**
   * GET /listings/nearby
   *
   * Protected endpoint.
   *
   * Uses the authenticated user's saved profile coordinates
   * and returns active listings within the requested radius.
   */
  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get nearby marketplace listings using the user profile location',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedListingsDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Profile location is required',
  })
  async findNearby(
    @CurrentUser('id') userId: string,
    @Query()
    query: NearbyListingsQueryDto,
  ): Promise<PaginatedListingsDto> {
    return this.listingsService.findNearby(userId, query);
  }

  /** GET /listings/mine/recent — bounded dashboard preview for the authenticated user. */
  @Get('mine/recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get up to three recent listings for the authenticated farmer' })
  @ApiResponse({ status: HttpStatus.OK, type: [RecentListingResponseDto] })
  findRecentMine(@CurrentUser('id') userId: string): Promise<RecentListingResponseDto[]> {
    return this.listingsService.findRecentMine(userId);
  }

  /** GET /listings/mine/management — bounded and filterable owner listing view. */
  @Get('mine/management')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a paginated, searchable listing page and owner listing counts' })
  @ApiResponse({ status: HttpStatus.OK, type: MyListingsManagementResponseDto })
  findMineManagement(
    @CurrentUser('id') userId: string,
    @Query() query: QueryMyListingsManagementDto,
  ): Promise<MyListingsManagementResponseDto> {
    return this.listingsService.findMineManagement(userId, query);
  }

  /** GET /listings/mine — only listings owned by the authenticated user. */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated farmer’s listings' })
  @ApiResponse({ status: HttpStatus.OK, type: [ListingResponseDto] })
  findMine(@CurrentUser('id') userId: string): Promise<ListingResponseDto[]> {
    return this.listingsService.findMine(userId);
  }

  /** GET /listings/mine/:id — fetch an owned listing for editing. */
  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one of the authenticated farmer’s listings' })
  @ApiResponse({ status: HttpStatus.OK, type: ListingResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Listing not found' })
  findMineById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.findMineById(userId, id);
  }

  /**
   * POST /listings
   * Stores a listing against the authenticated farmer in PostgreSQL.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a marketplace listing' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ListingResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an owned marketplace listing' })
  @ApiResponse({ status: HttpStatus.OK, type: ListingResponseDto })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.update(userId, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the status of an owned marketplace listing' })
  @ApiResponse({ status: HttpStatus.OK, type: ListingResponseDto })
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListingStatusDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.updateStatus(userId, id, dto.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an owned marketplace listing' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Listing deleted' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.listingsService.remove(userId, id);
    return { message: 'Listing deleted' };
  }

  /**
   * GET /listings/:id/related
   *
   * Public — no auth required.
   * Returns only active listings that belong to the same crop
   * as the current listing.
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/related')
  @ApiOperation({
    summary: 'Get related marketplace listings for a listing',
  })
  @ApiResponse({
    status: 200,
    type: [ListingResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Current listing not found',
  })
  findRelated(
    @Param('id') id: string,
    @CurrentUser('id') userId: string | null,
  ): Promise<ListingResponseDto[]> {
    return this.listingsService.findRelated(id, Boolean(userId));
  }

  /**
   * GET /listings/:id
   * Public — no auth required.
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a single listing by ID' })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string | null,
  ): Promise<ListingResponseDto> {
    return this.listingsService.findOne(id, Boolean(userId));
  }
}
