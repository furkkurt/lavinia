import { apiFetch } from './config';

export interface Menu {
  id: number;
  name: string;
  isSystem?: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  link: string;
  childItems?: MenuItem[];
}

// Get all published menus (public endpoint)
export async function getMenus(): Promise<Menu[] | null> {
  const response = await apiFetch<Menu[]>('/api/public/menus');

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching menus:', response.error);
    }
    return null;
  }

  return response.data || null;
}

// Get menu items for a specific menu (public endpoint)
export async function getMenuItems(menuId: number): Promise<MenuItem[] | null> {
  const response = await apiFetch<MenuItem[]>(`/api/public/menus/${menuId}`);

  if (response.error) {
    // Only log non-401 and non-404 errors
    if (response.status !== 401 && response.status !== 404) {
      console.error('Error fetching menu items:', response.error);
    }
    return null;
  }

  return response.data || null;
}
