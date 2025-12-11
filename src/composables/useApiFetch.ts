// src/composables/useApiFetch.ts
import { ref, watch, toValue, isRef, reactive, inject } from 'vue';
import type { Ref, WatchSource } from 'vue';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

interface onResponseContext<T> {
  response: AxiosResponse;
  request: string;
  options: UseApiFetchOptions<T>;
}
interface onResponseErrorContext<T> {
  error: AxiosError;
  request: string;
  options: UseApiFetchOptions<T>;
  attempt: { current: number; total: number };
}
export interface UseApiFetchOptions<T> {
  initialData?: T;
  // Parâmetros da requisição
  params?: Record<string, any> | Ref<Record<string, any>>;
  // Se false, não observará mudanças em params
  paramsReactives?: boolean;
  // Número de tentativas em caso de falha
  retry?: number;
  // Número de milissegundos entre tentativas
  retryDelay?: number;
  // Função para transformar os dados da resposta
  transform?: (data: any) => T;
  // Função chamada após uma resposta bem-sucedida 
  onResponse?: (context: onResponseContext<T>) => void;
  // Função chamada após uma resposta com erro
  onResponseError?: (context: onResponseErrorContext<T>) => void;
  // Opções adicionais para a requisição Axios
  apiOptions?: AxiosRequestConfig;
  // Fontes reativas adicionais para observar
  watch?: WatchSource[];
  // Controla se vai fazer a requisição imediatamente ou não
  immediate?: boolean;
  // bloqueia qualquer requisição se vier como true
  disable_request?: boolean;
}


export interface UseApiFetchReturn<T> {
  data: Ref<T | null>;
  pending: Ref<boolean>;
  error: Ref<AxiosError | null>;
  execute: () => Promise<void>;
  attempt: { current: number; total: number };
}

export function useApiFetch<T = any>(
  url: string | Ref<string>,
  options: UseApiFetchOptions<T> = {},
  customApiInstance: string | null = null
): UseApiFetchReturn<T> {

  // Se uma instância customizada for passada, use-a.
  // Senão, use a padrão injetada pelo plugin.
  const api = inject<AxiosInstance | null>(customApiInstance || 'api');

  if (!api) {
    throw new Error('useApiFetch: Instância da API não encontrada. Verifique se o AxiosPlugin está instalado no main.js com app.use(AxiosPlugin, { ... })');
  }
  let shouldExecuteImmediately: boolean

  if(
    'immediate' in options
  ){
    shouldExecuteImmediately = options.immediate !== false;
  }else{
    shouldExecuteImmediately = true;
  }
  const data = ref<T | null>(options.initialData ?? null);
  const pending = ref<boolean>(shouldExecuteImmediately);
  const error = ref<AxiosError | null>(null);
  const attempt = reactive({ current: 0, total: 0 });

  const execute = async () => {
    if (options.disable_request) {
      pending.value = false;
      return;
    }
    if (options.initialData) {
      data.value = options.initialData;
    }
    pending.value = true;
    error.value = null;
    attempt.current = 0;

    const currentUrl = toValue(url);
    const currentParams = toValue(options.params);
    const apiOptions = options.apiOptions || {};

    const totalAttempts = options.retry || 1;
    const retryDelayMs = options.retryDelay || 1000;
    attempt.total = totalAttempts;

    for (let i = 0; i < totalAttempts; i++) {
      attempt.current = i + 1;
      try {
        const response = await api.get(currentUrl, {
          params: currentParams,
          ...apiOptions
        });
        let responseData = response.data as T;
        if (options.transform && typeof options.transform === 'function') {
          responseData = options.transform(responseData);
        }
        data.value = responseData;
        error.value = null;
        if (options.onResponse && typeof options.onResponse === 'function') {
          options.onResponse({ request: currentUrl, response, options });
        }
        break;
      } catch (err : any) {
        error.value = err;

        if (options.onResponseError && typeof options.onResponseError === 'function') {
          options.onResponseError({ request: currentUrl, error: err, options, attempt });
        }

        if (i < totalAttempts - 1) {
          await delay(retryDelayMs);
        }
      }
    }
    pending.value = false;
  };

  const watchSources: WatchSource[] = [];
  if (isRef(url) || typeof url === 'function') watchSources.push(url);
  if (options.params && options.paramsReactives !== false) {
    if (isRef(options.params)) {
      // Se for uma ref, pode adicionar diretamente
      watchSources.push(options.params);
    } else {
      // Se for um objeto simples, cria uma função getter que o retorne
      watchSources.push(() => options.params);
    }
  }
  if (options.watch && Array.isArray(options.watch)) {
    options.watch.forEach(source => {
      if (isRef(source) || typeof source === 'function') watchSources.push(source);
    });
  }

  if (watchSources.length > 0) {
    watch(watchSources, execute, { deep: true, immediate: shouldExecuteImmediately });
  } else {
    if (shouldExecuteImmediately) {
      execute();
    }
  }

return {
  data,
  pending,
  error,
  execute,
  attempt
} as UseApiFetchReturn<T>;
}