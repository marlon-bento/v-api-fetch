// src/composables/useApi.js
import { inject } from 'vue'

/**
 * Composable para acessar a instância da API do Axios injetada pelo plugin.
 * @returns {import('axios').AxiosInstance} A instância da API.
 */
export function useApi() {
  const api = inject('api')
  if (!api) {
    throw new Error('A instância da API não foi encontrada. Verifique se o AxiosPlugin está instalado no main.js.')
  }
  return api
}