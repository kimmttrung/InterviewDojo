import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CodeforcesService } from './codeforces.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { CodeforcesMetadata } from './utils/cfdefault.utils';

@Controller('codeforces')
export class CodeforcesController {
  constructor(private readonly cfService: CodeforcesService) {}

  @Post('submit')
  async handleSubmit(@Body() submitDto: SubmitCodeDto) {
    // NestJS sẽ tự động validate submitDto trước khi vào hàm này
    return this.cfService.submitCode(submitDto);
  }

  @Get('profile/:handle')
  async getProfile(@Param('handle') handle: string) {
    return await this.cfService.getUserProfile(handle);
  }

  @Get('languages')
  getLanguages() {
    // Trả về danh sách ngôn ngữ để Frontend làm dropdown menu
    return CodeforcesMetadata.getLanguages();
  }

  @Get('countries')
  getCountries() {
    // Trả về danh sách quốc gia
    return CodeforcesMetadata.getCountries();
  }

  @Get('solution')
  async getSolution(
    @Query('subId') subId: number,
    @Query('contestId') contestId: number,
  ) {
    return this.cfService.getSolutionCode(subId, contestId);
  }
}
