import { api } from '../lib/api';
import { API_ENDPOINT } from '../lib/endpoints';

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
