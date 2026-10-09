import {
  Controller,
  Get,
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

import { JwtAuthGuard } from '@/modules/authentication/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/authentication/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async findMine(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findMine(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the unread notification count for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Unread notification count retrieved successfully' })
  async unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one authenticated-user notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.notificationsService.markRead(userId, id);
  }
}
