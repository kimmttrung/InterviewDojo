import { api } from '../lib/api';
import { API_ENPOINT } from '../lib/endpoints';

export interface TargetRole {
  id: number;
  name: string;
}

export const targetRoleService = {
  // 🔥 GET list roles (PUBLIC)
  getAll: () => {
    return api.get(API_ENPOINT.TARGET_ROLE.GET);
  },

  // 🔥 CREATE 1 role (admin/staff)
  create: (data: { name: string }) => {
    return api.post(API_ENPOINT.TARGET_ROLE.CREATE, data);
  },

  // 🔥 CREATE MANY
  createMany: (data: { names: string[] }) => {
    return api.post(API_ENPOINT.TARGET_ROLE.CREATE_LIST, data);
  },
};
