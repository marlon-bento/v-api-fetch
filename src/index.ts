// src/index.ts
import { AxiosPlugin } from './plugin/index';
import { useApiFetch } from './composables/useApiFetch';
import { useApi } from './composables/useApi';
import { createApiInstance } from './apiFactory';

// Exporta as funcionalidades da biblioteca
export {
  AxiosPlugin,
  useApiFetch,
  useApi,
  createApiInstance
};