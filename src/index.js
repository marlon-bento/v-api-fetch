// src/index.js
import { AxiosPlugin } from './plugin/index.js';
import { useApiFetch } from './composables/useApiFetch.js';
import { useApi } from './composables/useApi.js';
import { createApiInstance } from './apiFactory.js';
// Exporta as funcionalidades da biblioteca
export {
  AxiosPlugin,
  useApiFetch,
  useApi,
  createApiInstance
};