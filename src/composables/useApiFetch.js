// src/composables/useApiFetch.js
import { ref, watch, toValue, isRef, reactive, inject } from 'vue';
import { instances } from "../store.js";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function useApiFetch(url, options = {}, customApiInstance = null) {
  // Se uma instância customizada for passada, use-a.
  // Senão, use a padrão injetada pelo plugin.
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
    throw new Error('useApiFetch: O plugin Axios não foi instalado. Use app.use(AxiosPlugin, { ... }) no seu main.js.');
  }

  const data = ref(null);
  const pending = ref(true);
  const error = ref(null);
  const attempt = reactive({ current: 0, total: 0 });

  const execute = async () => {
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
        let responseData = response.data;
        if (options.transform && typeof options.transform === 'function') {
          responseData = options.transform(responseData);
        }
        data.value = responseData;
        error.value = null;
        if (options.onResponse && typeof options.onResponse === 'function') {
          options.onResponse({ request: currentUrl, response, options });
        }
        break;
      } catch (err) {
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

  const watchSources = [];
  if (isRef(url) || typeof url === 'function') watchSources.push(url);
  if (options.params && options.paramsReactives !== false) watchSources.push(options.params);
  if (options.watch && Array.isArray(options.watch)) {
    options.watch.forEach(source => {
      if (isRef(source) || typeof source === 'function') watchSources.push(source);
    });
  }

  if (watchSources.length > 0) {
    watch(watchSources, execute, { deep: true, immediate: true });
  } else {
    execute();
  }

  return { data, pending, error, execute, attempt };
}