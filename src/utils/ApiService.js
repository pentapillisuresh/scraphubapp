// src/services/ApiService.js

import axios from 'axios';

export const initialAuthState = {
  userId: 4,
  userName: 'admin',
  companyCode: 'scrabHub',
  unitCode: 'scrab',
};

const ApiService = (() => {

  const baseURL = 'http://10.205.113.71:5001/api/v1'; // Or use a global variable or config import
  // const baseURL = 'https://srabhubservices.scrabhub.com/api/v1'; // Or use a global variable or config import

const axiosInstance = axios.create({
  baseURL,
  timeout: 1000000,
});

// Interceptor for handling requests
  axiosInstance.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'; // Set for FormData
    } else {
      config.headers['Content-Type'] = 'application/json'; // Default
    }
    return config;
  });

  // Interceptor for handling responses
  axiosInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      console.error(
        'API error:',
        error.response ? error.response.data : error.message
      );
      return Promise.reject(error.response || error.message);
    }
  );

  return {
    // ✅ Accept full config (headers, params, etc.)
    get: (url, config = {}) => axiosInstance.get(url, config),
    post: (url, data, config = {}) => axiosInstance.post(url, data, config),
    put: (url, data, config = {}) => axiosInstance.put(url, data, config),
    delete: (url, config = {}) => axiosInstance.delete(url, config),
  };
})();

export default ApiService;
