// src/modules/code-engine/code-engine.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CodeEngineService {
  async executeCode(sourceCode: string, languageId: string) {
    try {
      const response = await axios.post(
        `${process.env.JUDGE0_URL}?base64_encoded=true&wait=true`,
        {
          source_code: Buffer.from(sourceCode).toString('base64'),
          language_id: Number(languageId),
        },
        {
          headers: {
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': process.env.JUDGE0_HOST,
          },
        },
      );

      // Ép kiểu dữ liệu để tránh 'any'
      const data = response.data;

      const decode = (str: any): string => {
        if (!str || typeof str !== 'string') return '';
        try {
          // Xử lý chuỗi Base64 có ký tự lạ (như \n)
          const cleanStr = str.replace(/[^A-Za-z0-9+/=]/g, '');
          return Buffer.from(cleanStr, 'base64').toString('utf-8');
        } catch (e) {
          console.log('check', e);
          return 'Lỗi giải mã';
        }
      };

      // TRẢ VỀ OBJECT MỚI - Đảm bảo các trường không bị undefined
      const result = {
        stdout: decode(data.stdout),
        stderr: decode(data.stderr),
        compile_output: decode(data.compile_output),
        message: decode(data.message),
        // Lấy description từ object status lồng nhau
        status:
          data.status && data.status.description
            ? data.status.description
            : 'Unknown',
        time: data.time || '0',
        memory: data.memory || 0,
      };

      console.log('Kết quả sau khi xử lý:', result);
      return result;
    } catch (error) {
      console.error('Lỗi hệ thống:', error);
      throw new InternalServerErrorException('Không thể kết nối Judge0');
    }
  }
}
