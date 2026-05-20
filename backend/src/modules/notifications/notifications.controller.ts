import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  @ResponseMessage(Messages.NOTIFICATIONS.FETCHED)
  findMyNotifications(
    @CurrentUser() user: any,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findMyNotifications(
      Number(user.sub),
      query,
    );
  }

  @Patch(':id/read')
  @ResponseMessage(Messages.NOTIFICATIONS.MARKED_AS_READ)
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(Number(user.sub), Number(id));
  }

  @Patch('read-all')
  @ResponseMessage(Messages.NOTIFICATIONS.MARKED_ALL_AS_READ)
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(Number(user.sub));
  }
}
