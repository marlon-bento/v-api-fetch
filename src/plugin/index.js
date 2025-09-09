// src/plugin/index.js
import axios from 'axios';

export const AxiosPlugin = {
  /**
   * Função de instalação do plugin Vue.
   * @param {import('vue').App} app - A instância da aplicação Vue.
   * @param {object} options - As opções de configuração do plugin.
   */
  install(app, options = {}) {
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

    const api = axios.create({
      baseURL: baseURL,
    });

    if (requestInterceptor && typeof requestInterceptor === 'function') {
      api.interceptors.request.use(requestInterceptor);
    }

    api.interceptors.response.use(
      (response) => response,
      errorInterceptor || ((error) => Promise.reject(error))
    );

    app.provide('api', api);
    app.config.globalProperties.$api = api;
  }
};