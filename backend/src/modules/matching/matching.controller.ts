import { Controller, Post, Body, Delete } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { CreateMatchingDto } from './dto/create-matching.dto';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('join')
  async joinQueue(@Body() dto: CreateMatchingDto) {
    return await this.matchingService.handleJoinQueue(dto.userId, dto.level);
  }

  @Delete('leave')
  async leaveQueue(@Body() dto: CreateMatchingDto) {
    return await this.matchingService.handleLeaveQueue(dto.userId, dto.level);
  }
}
