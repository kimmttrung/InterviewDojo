// src/modules/code-engine/code-engine.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CodeEngineService {
  async executeCode(sourceCode: string, languageId: string) {
    try {
      // Ép kiểu Number để chắc chắn Judge0 nhận diện được
      const langId = Number(languageId);

      const response = await axios.post(
        `${process.env.JUDGE0_URL}?base64_encoded=true&wait=true`,
        {
          source_code: Buffer.from(sourceCode).toString('base64'),
          language_id: langId,
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': process.env.JUDGE0_HOST,
          },
        },
      );

      const decode = (str: string) =>
        str ? Buffer.from(str, 'base64').toString() : '';

      return {
        stdout: decode(response.data.stdout),
        stderr: decode(response.data.stderr),
        compile_output: decode(response.data.compile_output),
        status: response.data.status?.description,
      };
    } catch (error) {
      console.error(
        'Lỗi thực thi Judge0:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Lỗi hệ thống thực thi code');
    }
  }
}
