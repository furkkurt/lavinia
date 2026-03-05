import { apiFetch } from './config';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isLockedOut?: boolean;
  createdOn?: string;
  roles?: string[];
  vendorId?: number;
}

export interface UserForm {
  id?: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  roleIds?: number[];
  customerGroupIds?: number[];
  vendorId?: number;
}

export interface UserGridParams {
  pageIndex?: number;
  pageSize?: number;
  sort?: Array<{
    field: string;
    dir: 'asc' | 'desc';
  }>;
  filter?: {
    logic?: 'and' | 'or';
    filters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
}

export interface UserGridResponse {
  data: User[];
  total: number;
}

// Get users with pagination (backend expects SmartTable format)
export async function getUsersGrid(params: UserGridParams): Promise<UserGridResponse | null> {
  const pageIndex = params.pageIndex || 0;
  const pageSize = params.pageSize || 20;

  // Convert to backend SmartTable format: pagination, sort, search
  // Backend expects PascalCase property names (e.g. Id, Email, FullName)
  const sortField = params.sort?.[0]?.field;
  const predicate = sortField
    ? sortField.charAt(0).toUpperCase() + sortField.slice(1)
    : 'Id';
  const sortObj = params.sort && params.sort.length > 0
    ? { predicate, reverse: params.sort[0].dir === 'desc' }
    : { predicate: 'Id', reverse: true };

  const requestBody = {
    pagination: { start: pageIndex * pageSize, number: pageSize },
    sort: sortObj,
    search: { predicateObject: {} as Record<string, unknown> },
  };

  // Add filters if provided
  if (params.filter && params.filter.filters && params.filter.filters.length > 0) {
    requestBody.search.predicateObject.filter = params.filter;
  }

  const response = await apiFetch<{ items: User[]; totalRecord: number }>('/api/users/grid', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (response.error) {
    console.error('Error fetching users:', response.error);
    return null;
  }

  const data = response.data;
  if (!data) return null;

  // Map SmartTable response (items, totalRecord) to frontend format (data, total)
  return {
    data: data.items || [],
    total: data.totalRecord ?? 0,
  };
}

// Get single user
export async function getUser(id: number): Promise<User | null> {
  const response = await apiFetch<User>(`/api/users/${id}`);

  if (response.error) {
    console.error('Error fetching user:', response.error);
    return null;
  }

  return response.data || null;
}

// Create user
export async function createUser(user: UserForm): Promise<User | null> {
  const response = await apiFetch<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });

  if (response.error) {
    console.error('Error creating user:', response.error);
    console.error('Response status:', response.status);
    // Throw error with message so it can be caught and displayed
    throw new Error(response.error || 'Kullanıcı oluşturulamadı');
  }

  if (!response.data) {
    throw new Error('Sunucudan yanıt alınamadı');
  }

  return response.data;
}

// Update user
export async function updateUser(id: number, user: Partial<UserForm>): Promise<User | null> {
  const response = await apiFetch<User>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });

  if (response.error) {
    console.error('Error updating user:', response.error);
    return null;
  }

  return response.data || null;
}

// Delete user
export async function deleteUser(id: number): Promise<boolean> {
  const response = await apiFetch(`/api/users/${id}`, {
    method: 'DELETE',
  });

  if (response.error) {
    console.error('Error deleting user:', response.error);
    return false;
  }

  return true;
}

// Quick search users
export async function quickSearchUsers(name?: string, email?: string): Promise<User[] | null> {
  const params = new URLSearchParams();
  if (name) params.append('Name', name);
  if (email) params.append('Email', email);

  const response = await apiFetch<User[]>(`/api/users/quick-search?${params.toString()}`);

  if (response.error) {
    console.error('Error searching users:', response.error);
    return null;
  }

  return response.data || null;
}
