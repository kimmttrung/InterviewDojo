import { Controller, Post, Body } from '@nestjs/common';
import { StreamService } from './stream.service';

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post('token')
  getToken(@Body('userId') userId: string) {
    const token = this.streamService.createToken(userId);
    return { token };
  }
}
