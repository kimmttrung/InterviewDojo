import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CodeEngineService {

  // Dùng cho /run — không có stdin
  async executeCode(sourceCode: string, languageId: string) {
    return this.callJudge0(sourceCode, Number(languageId), '');
  }

  // Dùng cho processor — có stdin từng test case
  async executeWithInput(sourceCode: string, languageId: number, stdin: string = '') {
    return this.callJudge0(sourceCode, languageId, stdin);
  }

  // private method dungf chung 
  private async callJudge0(sourceCode: string, languageId: number, stdin: string) {
    try {
      const response = await axios.post(
        `${process.env.JUDGE0_URL}?base64_encoded=true&wait=true`,
        {
          source_code: Buffer.from(sourceCode).toString('base64'),
          language_id: languageId,
          stdin: stdin ? Buffer.from(stdin).toString('base64') : '',
        },
        {
          headers: {
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': process.env.JUDGE0_HOST,
          },
        },
      );

      const data = response.data;

      const decode = (str?: any): string => {
        if (!str || typeof str !== 'string') return '';
        try {
          const clean = str.replace(/[^A-Za-z0-9+/=]/g, '');
          return Buffer.from(clean, 'base64').toString('utf-8');
        } catch {
          return str;
        }
      };

      return {
        stdout:         decode(data.stdout),
        stderr:         decode(data.stderr),
        compile_output: decode(data.compile_output),
        status:         data.status?.description || 'Unknown',
        time:           data.time   || '0',
        memory:         data.memory || 0,
      };
    } catch (error) {
      console.error('Judge0 error:', error);
      throw new InternalServerErrorException('Không thể kết nối Judge0');
    }
  }
}