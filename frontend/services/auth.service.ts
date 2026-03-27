import { api } from "../lib/api"
import { API_ENPOINT } from "../lib/endpoints"

export interface LoginDto {
    email: string,
    password: string

}
export const authService = {
    register: (data: any) => {
        return api.post(API_ENPOINT.AUTH.REGISTER, data)
    },
    login: (data: LoginDto) => {
        return api.post(API_ENPOINT.AUTH.LOGIN, data)
    }

}