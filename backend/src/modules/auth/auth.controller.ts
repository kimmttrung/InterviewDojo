import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterMentorDto } from './dto/register-mentor.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('register-mentor')
  registerMentor(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RegisterMentorDto,
  ) {
    return this.authService.registerMentor(dto);
  }

  @Post('login')
  login(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }
}