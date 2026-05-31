import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';

// DTO cho dữ liệu gửi lên
export interface ExecuteCodeDto {
  code: string;
  languageId: string;
}

// Interface cho kết quả trả về từ Backend
export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  message: string;
  status: string;
  time: string;
  memory: number;
}

export const codeEngineService = {
  /**
   * Thực thi mã nguồn thông qua Judge0 Engine
   */
  runCode: (data: ExecuteCodeDto) => {
    return api.post<CodeExecutionResult>(API_ENDPOINT.CODE_ENGINE.RUN, data);
  },
};
