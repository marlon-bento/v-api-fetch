// src/composables/useApi.ts
import { inject } from 'vue'
import { instances } from "../store";

import type { AxiosInstance } from 'axios';
/**
 * Composable para acessar a instância da API do Axios injetada pelo plugin.
 * @returns {AxiosInstance} A instância da API.
 */
export function useApi(customApiInstance: string | null = null): AxiosInstance {
  let api: AxiosInstance | undefined
  if (customApiInstance) {
    if (!instances.includes(customApiInstance)) {
      throw new Error(`[useApi] Não existe instância com o nome "${customApiInstance}".`);
    }
    api = inject<AxiosInstance>(customApiInstance)
  } else {
    api = inject<AxiosInstance>('api')
  }

  if (!api ) {
    throw new Error('A instância da API não foi encontrada. Verifique se o AxiosPlugin está instalado no main.js.')
  }
  return api
}