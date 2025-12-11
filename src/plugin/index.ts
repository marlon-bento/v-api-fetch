// src/plugin/index.ts
import axios, {isCancel} from 'axios';

import type { App, Plugin } from 'vue';
import type { 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosError 
} from 'axios';


export interface AxiosPluginOptions {
  hostApi: string;
  subpath?: string;
  baseApi?: string;
  requestInterceptor?: (config: InternalAxiosRequestConfig) => 
    InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  errorInterceptor?: (error: AxiosError) => any;
}

export const AxiosPlugin: Plugin = {
  /**
   * Função de instalação do plugin Vue.
   * @param {import('vue').App} app - A instância da aplicação Vue.
   * @param {object} options - As opções de configuração do plugin.
   */
  install(app: App, options: AxiosPluginOptions) {
    const {
      hostApi,
      subpath = '',
      baseApi = '',
      requestInterceptor,
      errorInterceptor,
    } = options;

    if (!hostApi) {
      throw new Error('[AxiosPlugin] A opção "hostApi" é obrigatória.');
    }

    const cleanHost = hostApi.replace(/\/$/, '');
    const cleanSubpath = subpath.replace(/\/$/, '');
    const cleanBaseApi = baseApi.replace(/\/$/, '');

    const baseURL = cleanSubpath
      ? `${cleanHost}/${cleanSubpath}${cleanBaseApi}`
      : `${cleanHost}${cleanBaseApi}`;

    const api: AxiosInstance = axios.create({
      baseURL: baseURL,
    });

    if (requestInterceptor) {
      api.interceptors.request.use(requestInterceptor);
    }

    api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (isCancel(error)) {
          // Se for cancelado, rejeita a Promise silenciosamente.
          // Isso impede que o 'errorInterceptor' do usuário seja chamado.
          return Promise.reject(error);
        }
        // se não for cancelado, chama o interceptor de erro do usuário, se existir.
        if (errorInterceptor) {
          return errorInterceptor(error);
        }
        return Promise.reject(error);
      }
      
    );

    // Fornece a instância para a Composition API (inject)
    app.provide('api', api);

    // Fornece a instância para a Options API (this.$api)
    app.config.globalProperties.$api = api;
  }
};