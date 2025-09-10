// src/apiFactory.js   

import axios from 'axios';
import { instances } from "./store.js";
/**
 * Cria uma instância configurada do Axios.
 * É a função base usada por outras funções neste factory.
 * @param {object} app - A instância do Vue (app).
 * @param {object} options - Opções de configuração para a instância do Axios.
 * @returns {import('axios').AxiosInstance}
 */
export function createApiInstance(app, options = {}) {

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

  const api = axios.create({ baseURL });

  if (requestInterceptor && typeof requestInterceptor === 'function') {
    api.interceptors.request.use(requestInterceptor);
  }
  
  api.interceptors.response.use(
    response => response, 
    errorInterceptor || (error => Promise.reject(error))
  );

  app.provide(name, api);
  instances.push(name);
}

