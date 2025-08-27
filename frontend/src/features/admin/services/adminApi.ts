import { apiGet } from '../../shared/services/api';

export interface AdminMenuItem {
  key: string;
  label: string;
}

export async function getIsAdmin(): Promise<boolean> {
  try {
    const data = await apiGet<{ isAdmin: boolean }>("/api/admin/permissions/me");
    return !!data?.isAdmin;
  } catch {
    return false;
  }
}

export async function getAdminMenus(): Promise<AdminMenuItem[]> {
  try {
    const data = await apiGet<AdminMenuItem[]>("/api/admin/menus");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
