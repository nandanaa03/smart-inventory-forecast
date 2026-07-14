import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});

// Products
export const getProducts = () => api.get('/products');
export const addProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Sales
export const addSale = (data) => api.post('/sales', data);
export const getSalesForProduct = (id) => api.get(`/sales/${id}`);

// Documents
export const uploadDocument = (data) => api.post('/documents/upload', data);
export const getDocuments = (productId) => api.get(`/documents/${productId}`);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// Forecast
export const getForecast = (productId) => api.get(`/forecast/${productId}`);