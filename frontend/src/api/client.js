import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

// Unwrap the data from the standard response format
const unwrap = (res) => res.data.data;

// Products
export const getProducts = () => api.get('/products').then(unwrap);
export const addProduct = (data) => api.post('/products', data).then(unwrap);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(unwrap);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(unwrap);

// Sales
export const addSale = (data) => api.post('/sales', data).then(unwrap);
export const getSalesForProduct = (id) => api.get(`/sales/${id}`).then(unwrap);

// Documents
export const uploadDocument = (data) => api.post('/documents/upload', data).then(unwrap);
export const getDocuments = (productId) => api.get(`/documents/${productId}`).then(unwrap);
export const deleteDocument = (id) => api.delete(`/documents/${id}`).then(unwrap);

// Forecast
export const getForecast = (productId) => api.get(`/forecast/${productId}`).then(unwrap);