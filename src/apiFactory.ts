// src/apiFactory.ts   

import axios from 'axios';
import { instances } from "./store.js";

import type { App } from 'vue';
import type { 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosError 
} from 'axios';

export interface AxiosPluginOptions {
  name: string;
  hostApi: string;
  subpath?: string;
  baseApi?: string;
  requestInterceptor?: (config: InternalAxiosRequestConfig) => 
    InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  errorInterceptor?: (error: AxiosError) => any;
}
/**
 * Cria uma instância configurada do Axios.
 * É a função base usada por outras funções neste factory.
 * @param {object} app - A instância do Vue (app).
 * @param {object} options - Opções de configuração para a instância do Axios.
 * @returns {import('axios').AxiosInstance}
 */
export function createApiInstance(app: App, options: AxiosPluginOptions ): void {

  const { 
    name = '',
    hostApi, 
    subpath = '', 
    baseApi = '', 
    requestInterceptor, 
    errorInterceptor 
  } = options;

  if (!hostApi) {
    throw new Error('[createApiInstance] A opção "hostApi" é obrigatória.');
  }
  if (name === '') {
    throw new Error('[createApiInstance] A opção "name" é obrigatória e deve ser única.');
  }
  if (instances.includes(name)) {
    throw new Error(`[createApiInstance] Já existe uma instância com o nome "${name}". Use um nome único.`);
  }
  // Limpa barras extras no final das strings
  const cleanHost = hostApi.replace(/\/$/, '');
  const cleanSubpath = subpath.replace(/\/$/, '');
  const cleanBaseApi = baseApi.replace(/\/$/, '');

  // Constrói a URL final
  const baseURL = cleanSubpath
    ? `${cleanHost}/${cleanSubpath}${cleanBaseApi}`
    : `${cleanHost}${cleanBaseApi}`;

  const api: AxiosInstance = axios.create({ baseURL });

  if (requestInterceptor && typeof requestInterceptor === 'function') {
    api.interceptors.request.use(requestInterceptor);
  }
  
  api.interceptors.response.use(
    (response) => response,
    errorInterceptor || ((error: AxiosError) => Promise.reject(error))
  );
  // Fornece a instância para a Composition API (inject)
  app.provide(name, api);
  // Fornece a instância para a Options API (this.$api)
  app.config.globalProperties[`$${name}`] = api;
  
  // Registra o nome da instância criada
  instances.push(name);
}

