// src/composables/useApi.js
import { inject } from 'vue'
import { instances } from "../store.js";
/**
 * Composable para acessar a instância da API do Axios injetada pelo plugin.
 * @returns {import('axios').AxiosInstance} A instância da API.
 */
export function useApi(customApiInstance = null) {
  let api
  if (customApiInstance) {
    if (!instances.includes(customApiInstance)) {
      throw new Error(`[useApi] Não existe instância com o nome "${customApiInstance}".`);
    }
    api = inject(customApiInstance)
  } else {
    api = inject('api')
  }

  if (!api) {
    throw new Error('A instância da API não foi encontrada. Verifique se o AxiosPlugin está instalado no main.js.')
  }
  return api
}