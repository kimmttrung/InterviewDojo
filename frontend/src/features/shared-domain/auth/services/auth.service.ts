import { api } from '../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../shared/lib/endpoints';

export interface LoginDto {
  email: string;
  password: string;
}
export const authService = {
  register: (data: any) => {
    return api.post(API_ENDPOINT.AUTH.REGISTER, data);
  },
  login: (data: LoginDto) => {
    return api.post(API_ENDPOINT.AUTH.LOGIN, data);
  },
};
