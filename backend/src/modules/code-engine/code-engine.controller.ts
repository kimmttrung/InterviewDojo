import { Controller, Post, Body } from '@nestjs/common';
import { CodeEngineService } from './code-engine.service';
import { ExecuteCodeDto } from './dto/execute-code.dto';

@Controller('code-engine')
export class CodeEngineController {
  constructor(private readonly codeEngineService: CodeEngineService) {}

  @Post('run')
  async runCode(@Body() body: ExecuteCodeDto) {
    return await this.codeEngineService.executeCode(body.code, body.languageId);
  }
}
