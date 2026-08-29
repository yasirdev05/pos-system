import api from '@/lib/axios';

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const productService = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const customerService = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getOne: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const supplierService = {
  getAll: () => api.get('/suppliers'),
  getOne: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

export const saleService = {
  getAll: (params?: any) => api.get('/sales', { params }),
  getOne: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
};

export const inventoryService = {
  getAll: () => api.get('/inventory'),
  adjustStock: (data: any) => api.post('/inventory/adjust', data),
  getHistory: () => api.get('/inventory/history'),
};

export const expenseService = {
  getAll: () => api.get('/expenses'),
  create: (data: any) => api.post('/expenses', data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const uploadService = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

