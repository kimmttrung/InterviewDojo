import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { GetSessionsDto } from './dto/get-sessions.dto';
import {
  PaginatedResponse,
  SessionItem,
} from './interfaces/session.interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Messages } from '../../common/constants/messages.constant';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ResponseMessage(Messages.SESSION.SESSION_FETCHED)
  async getSessions(
    @CurrentUser() user: any,
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: GetSessionsDto,
  ): Promise<PaginatedResponse<SessionItem>> {
    const userId = Number(user.sub || user.id);
    return this.sessionService.getSessions(userId, query);
  }

  @Post(':sessionId/cancel')
  @ResponseMessage(Messages.SESSION.SESSION_CANCELLED)
  async cancelSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body('reason') reason: string,
  ) {
    const userId = Number(user.sub || user.id);
    return this.sessionService.cancelSession(userId, +sessionId, reason);
  }
}
