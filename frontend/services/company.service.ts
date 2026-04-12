import { api } from "../lib/api";
import { API_ENPOINT } from "../lib/endpoints";

export const companyService = {
    getAll: async () => {
        const res = await api.get(API_ENPOINT.COMPANIES.GET_ALL);
        return res.data;
    },
    create: async (data: { name: string; logoUrl?: string }) => {
        const res = await api.post(API_ENPOINT.COMPANIES.CREATE, data);
        return res.data;
    },
    update: async (id: number, data: { name?: string; logoUrl?: string }) => {
        const res = await api.put(API_ENPOINT.COMPANIES.UPDATE(id), data);
        return res.data;
    },
    delete: async (id: number) => {
        const res = await api.delete(API_ENPOINT.COMPANIES.DELETE(id));
        return res.data;
    }
}