// src/modules/code-engine/code-engine.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CodeEngineService } from './code-engine.service';

@Controller('code-engine')
export class CodeEngineController {
  constructor(private readonly codeEngineService: CodeEngineService) {}

  @Post('run')
  async runCode(@Body() body: { code: string; languageId: string }) {
    // Đảm bảo tên biến truyền vào Service khớp với biến từ Frontend gửi lên
    return await this.codeEngineService.executeCode(body.code, body.languageId);
  }
}
