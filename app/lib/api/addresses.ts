import { apiFetch } from './config';

export interface UserAddress {
  id: number;
  addressId: number;
  contactName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  zipCode?: string;
  districtName?: string;
  stateOrProvinceName: string;
  stateOrProvinceId: number;
  countryName: string;
  countryId: string;
  isDefault: boolean;
}

export interface AddressFormData {
  contactName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  zipCode?: string;
  stateOrProvinceId: number;
  districtId?: number;
  countryId?: string;
}

export async function getAddresses(): Promise<UserAddress[]> {
  const response = await apiFetch<UserAddress[]>('/api/user-addresses');
  return response.data || [];
}

export async function createAddress(data: AddressFormData): Promise<boolean> {
  const response = await apiFetch('/api/user-addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return !response.error;
}

export async function updateAddress(id: number, data: AddressFormData): Promise<boolean> {
  const response = await apiFetch(`/api/user-addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return !response.error;
}

export async function deleteAddress(id: number): Promise<boolean> {
  const response = await apiFetch(`/api/user-addresses/${id}`, {
    method: 'DELETE',
  });
  return !response.error;
}

export async function setDefaultAddress(id: number): Promise<boolean> {
  const response = await apiFetch(`/api/user-addresses/${id}/set-default`, {
    method: 'POST',
  });
  return !response.error;
}

export async function getCountries(): Promise<{ id: string; name: string }[]> {
  const response = await apiFetch<{ id: string; name: string }[]>('/api/user-addresses/countries');
  return response.data || [];
}

export async function getStates(countryId: string): Promise<{ id: number; name: string }[]> {
  const response = await apiFetch<{ id: number; name: string }[]>(`/api/user-addresses/states/${countryId}`);
  return response.data || [];
}
