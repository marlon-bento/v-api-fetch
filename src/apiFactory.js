// src/apiFactory.js

import axios from 'axios';

export function createApiInstance(options = {}) {
  const { 
    hostApi, 
    subpath = '', 
    baseApi = '/api/v1', 
    requestInterceptor, 
    errorInterceptor 
  } = options;

  if (!hostApi) {
    throw new Error('[createApiInstance] A opção "hostApi" é obrigatória.');
  }


  // Limpa barras extras no final das strings para evitar URLs como "http://site.com//api"
  const cleanHost = hostApi.replace(/\/$/, '');
  const cleanSubpath = subpath.replace(/\/$/, '');
  const cleanBaseApi = baseApi.replace(/\/$/, '');

  // Constrói a URL final, considerando se o subpath foi fornecido ou não
  const baseURL = cleanSubpath
    ? `${cleanHost}/${cleanSubpath}${cleanBaseApi}`
    : `${cleanHost}${cleanBaseApi}`;
  // -----------------------------------------------------

  // Agora a variável 'baseURL' tem um valor de string válido
  const api = axios.create({ baseURL });

  if (requestInterceptor) {
    api.interceptors.request.use(requestInterceptor);
  }
  
  api.interceptors.response.use(
    response => response, 
    errorInterceptor || (error => Promise.reject(error))
  );

  return api;
}