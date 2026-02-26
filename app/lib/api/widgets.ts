import { apiFetch, apiFetchMultipart } from './config';

export interface CarouselWidgetItem {
  id?: number;
  imageUrl?: string;
  image?: File;
  caption?: string;
  subCaption?: string;
  linkText?: string;
  linkUrl?: string;
}

export interface CarouselWidget {
  id?: number;
  name: string;
  widgetZoneId?: number;
  publishStart?: string;
  publishEnd?: string;
  displayOrder?: number;
  items: CarouselWidgetItem[];
}

// Get all widgets
export async function getWidgets(): Promise<any[] | null> {
  const response = await apiFetch<any[]>('/api/widgets');

  if (response.error) {
    console.error('Error fetching widgets:', response.error);
    return null;
  }

  return response.data || null;
}

// Get carousel widget
export async function getCarouselWidget(id: number): Promise<CarouselWidget | null> {
  const response = await apiFetch<CarouselWidget>(`/api/carousel-widgets/${id}`);

  if (response.error) {
    console.error('Error fetching carousel widget:', response.error);
    return null;
  }

  return response.data || null;
}

// Create carousel widget
export async function createCarouselWidget(widget: CarouselWidget): Promise<CarouselWidget | null> {
  const formData = new FormData();
  
  formData.append('Name', widget.name);
  if (widget.widgetZoneId) formData.append('WidgetZoneId', widget.widgetZoneId.toString());
  if (widget.publishStart) formData.append('PublishStart', widget.publishStart);
  if (widget.publishEnd) formData.append('PublishEnd', widget.publishEnd);
  if (widget.displayOrder !== undefined) formData.append('DisplayOrder', widget.displayOrder.toString());

  widget.items.forEach((item, index) => {
    if (item.image instanceof File) {
      formData.append(`Items[${index}].Image`, item.image);
    }
    if (item.caption) formData.append(`Items[${index}].Caption`, item.caption);
    if (item.subCaption) formData.append(`Items[${index}].SubCaption`, item.subCaption);
    if (item.linkText) formData.append(`Items[${index}].LinkText`, item.linkText);
    if (item.linkUrl) formData.append(`Items[${index}].LinkUrl`, item.linkUrl);
  });

  const response = await apiFetchMultipart<CarouselWidget>('/api/carousel-widgets', formData, {
    method: 'POST',
  });

  if (response.error) {
    console.error('Error creating carousel widget:', response.error);
    return null;
  }

  return response.data || null;
}

// Update carousel widget
export async function updateCarouselWidget(id: number, widget: CarouselWidget): Promise<CarouselWidget | null> {
  const formData = new FormData();
  
  formData.append('Id', id.toString());
  formData.append('Name', widget.name);
  if (widget.widgetZoneId) formData.append('WidgetZoneId', widget.widgetZoneId.toString());
  if (widget.publishStart) formData.append('PublishStart', widget.publishStart);
  if (widget.publishEnd) formData.append('PublishEnd', widget.publishEnd);
  if (widget.displayOrder !== undefined) formData.append('DisplayOrder', widget.displayOrder.toString());

  widget.items.forEach((item, index) => {
    if (item.id) formData.append(`Items[${index}].Id`, item.id.toString());
    if (item.image instanceof File) {
      formData.append(`Items[${index}].Image`, item.image);
    }
    if (item.caption) formData.append(`Items[${index}].Caption`, item.caption);
    if (item.subCaption) formData.append(`Items[${index}].SubCaption`, item.subCaption);
    if (item.linkText) formData.append(`Items[${index}].LinkText`, item.linkText);
    if (item.linkUrl) formData.append(`Items[${index}].LinkUrl`, item.linkUrl);
  });

  const response = await apiFetchMultipart<CarouselWidget>(`/api/carousel-widgets/${id}`, formData, {
    method: 'PUT',
  });

  if (response.error) {
    console.error('Error updating carousel widget:', response.error);
    return null;
  }

  return response.data || null;
}

// Delete widget instance
export async function deleteWidgetInstance(id: number): Promise<boolean> {
  const response = await apiFetch(`/api/widget-instances/${id}`, {
    method: 'DELETE',
  });

  if (response.error) {
    console.error('Error deleting widget instance:', response.error);
    return false;
  }

  return true;
}

// Get widget zones
export async function getWidgetZones(): Promise<any[] | null> {
  const response = await apiFetch<any[]>('/api/widget-zones');

  if (response.error) {
    console.error('Error fetching widget zones:', response.error);
    return null;
  }

  return response.data || null;
}
