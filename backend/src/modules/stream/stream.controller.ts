import { Controller, Post, UseGuards } from '@nestjs/common';
import { StreamService } from './stream.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('stream')
@UseGuards(JwtAuthGuard)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post('token')
  getToken(@CurrentUser() user: JwtPayload) {
    const token = this.streamService.createToken(String(user.sub));
    return { token };
  }
}
