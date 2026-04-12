import { api } from "../lib/api";
import { API_ENPOINT } from "../lib/endpoints";

export const categoryService = {
    getAll: async () => {
        const res = await api.get(API_ENPOINT.CATEGORIES.GET_ALL);
        return res.data;
    },
    create: async (data: { name: string; description?: string }) => {
        const res = await api.post(API_ENPOINT.CATEGORIES.CREATE, data);
        return res.data;
    },
    update: async (id: number, data: { name?: string; description?: string }) => {
        const res = await api.put(API_ENPOINT.CATEGORIES.UPDATE(id), data);
        return res.data;
    },
    delete: async (id: number) => {
        const res = await api.delete(API_ENPOINT.CATEGORIES.DELETE(id));
        return res.data;
    }
}