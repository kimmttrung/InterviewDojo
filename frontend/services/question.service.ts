import { api } from "../lib/api";
import { API_ENPOINT } from "../lib/endpoints";


export const questionService = {
    getAll: async (params?: any) => {
        // params bao gồm: page, limit, keyword, difficulty...
        const response = await api.get(API_ENPOINT.QUESTIONS.GET_ALL, { params, headers: { Authorization: `Bearer ${token}` } });
        return response.data; // Trả về object chứa { data, meta }
    },

    delete: async (id: number) => {
        return await api.delete(API_ENPOINT.QUESTIONS.DELETE(id), { headers: { Authorization: `Bearer ${token}` } });
    },

    getById: async (id: number) => {
        return await api.get(API_ENPOINT.QUESTIONS.GET_BY_ID(id), { headers: { Authorization: `Bearer ${token}` } });
    }
};