import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { SubmitCodeDto } from './dto/submit-code.dto';
// import { CodeforcesLanguages } from './utils/languages.utils';
// import { CodeforcesVerdicts } from './utils/verdicts';
import { CommonHeaders } from './utils/helpers.utils';
import * as crypto from 'crypto';
import { AxiosResponse } from 'axios';
@Injectable()
export class CodeforcesService {
  private readonly logger = new Logger(CodeforcesService.name);

  constructor(private readonly http: HttpService) {}

  async getUserProfile(handle: string) {
    const apiKey = process.env.CF_API_KEY;
    const apiSecret = process.env.CF_API_SECRET;

    if (!apiKey || !apiSecret) {
      this.logger.error('API Credentials missing in environment variables');
      throw new InternalServerErrorException('Cấu hình API không hợp lệ');
    }

    const time = Math.floor(Date.now() / 1000);
    const rand = Math.floor(Math.random() * 899999) + 100000;
    const methodName = 'user.info';

    // Sắp xếp params theo bảng chữ cái (Codeforces yêu cầu điều này nếu có nhiều params)
    const params = `apiKey=${apiKey}&handles=${handle}&time=${time}`;
    const textToHash = `${rand}/${methodName}?${params}#${apiSecret}`;

    const hash = crypto.createHash('sha512').update(textToHash).digest('hex');
    const apiSig = `${rand}${hash}`;

    const url = `https://codeforces.com/api/${methodName}?${params}&apiSig=${apiSig}`;

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.http.get(url, {
          headers: CommonHeaders,
          timeout: 5000,
        }),
      );

      if (response.data.status !== 'OK') {
        // Ép kiểu rõ ràng để TypeScript không than phiền
        const errorMessage =
          (response.data.comment as string) || 'API returned failed status';
        throw new Error(errorMessage);
      }

      return response.data.result[0];
    } catch (error: any) {
      this.logger.error(
        `Codeforces API Error [${handle}]: ${error?.response?.data?.comment || error.message}`,
      );
      throw new InternalServerErrorException(
        'Không thể lấy thông tin người dùng từ Codeforces',
      );
    }
  }

  async submitCode(dto: SubmitCodeDto) {
    try {
      // 1. Lấy CSRF token với CommonHeaders để giả lập trình duyệt
      const response = await firstValueFrom(
        this.http.get('https://codeforces.com/enter', {
          headers: CommonHeaders,
        }), // Thêm headers
      );

      const html = String(response.data);
      const $ = cheerio.load(html);
      const csrf = $('input[name="csrf_token"]').val();

      if (typeof csrf !== 'string') {
        throw new Error('Token not found');
      }

      // 2. Payload nộp bài
      const payload = {
        csrf_token: csrf,
        action: 'submitSolutionFormSubmitted',
        contestId: dto.contestId,
        submittedProblemIndex: dto.problemIndex,
        programTypeId: dto.languageId,
        source: dto.sourceCode,
        tabSize: '4',
      };

      // 3. Post với headers và cookie (nếu cần duy trì session)
      await firstValueFrom(
        this.http.post(
          `https://codeforces.com/contest/${dto.contestId}/submit`,
          payload,
          { headers: CommonHeaders }, // Thêm headers vào đây
        ),
      );

      return { success: true, contestId: dto.contestId };
    } catch (error) {
      this.logger.error(`Submit failed: ${error.message}`);
      throw new InternalServerErrorException('Submit failed');
    }
  }

  async getSolutionCode(submissionId: number, contestId: number) {
    const url = `https://codeforces.com/contest/${contestId}/submission/${submissionId}`;

    // Xử lý lỗi 'data' defined but never used: Dùng trực tiếp hoặc xóa đi
    const response = await firstValueFrom(this.http.get(url));
    const html = String(response.data);

    const $ = cheerio.load(html);
    return $('.program-source').text(); // Trả về nội dung code
  }
}
