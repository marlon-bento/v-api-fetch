# 🔌 v-api-fetch

## **🚀 O que é o `v-api-fetch`?**

`v-api-fetch` não é apenas um `composable`, é a sua **camada de dados completa e robusta** para aplicações Vue 3. Inspirado nas melhores práticas do ecossistema, como o `useFetch` do Nuxt.js, ele oferece uma solução "pronta para produção" para simplificar, organizar e padronizar toda a comunicação com APIs no seu projeto.

Ele foi desenhado para ser configurado uma única vez e então utilizado de forma intuitiva em todos os seus componentes, cuidando de todo o trabalho pesado de gerenciamento de estado, reatividade e execução de requisições.

### Principais Funcionalidades

* **🔌 Configuração Centralizada (`AxiosPlugin`):** Configure sua URL base, interceptadores de token e de erros em um único lugar (`main.ts`), e esqueça a configuração repetitiva.
* **🏭 Suporte a Múltiplas APIs (`createApiInstance`):** Não se limite a uma única API. Crie, nomeie e configure quantas instâncias do Axios você precisar e acesse-as de forma simples em todo o seu projeto.
* **✨ Busca de Dados Declarativa (`useApiFetch`):** Para buscar e exibir dados na tela. Ele gerencia automaticamente os estados de carregamento (`pending`), erros (`error`) e os dados (`data`) de forma reativa, com recursos avançados como `retries`, `transform`, `initialData` e um poderoso sistema de `watch`.
* **⚡ Ações Imperativas Simplificadas (`useApi`):** Para quando você precisa executar ações como `POST`, `DELETE`, ou `PUT`. Tenha acesso direto à instância configurada do Axios para ter controle total sobre suas requisições.
* **🛡️ Totalmente Tipado:** Construído com TypeScript para garantir segurança, autocomplete e uma excelente experiência de desenvolvimento.

---

## Como as peças se encaixam?

O fluxo de trabalho com `v-api-fetch` é simples e lógico:

1.  **Você configura** sua(s) API(s) uma única vez no `main.ts` usando o `AxiosPlugin` e, se necessário, `createApiInstance`.
2.  Nos componentes, **você busca dados** para exibição usando `useApiFetch`.
3.  Quando o usuário realiza uma ação (ex: envia um formulário), **você executa a ação** usando `useApi`.
4.  Após a ação, **você atualiza os dados** na tela chamando a função `execute` retornada pelo `useApiFetch`.

### **📦 Instalação**

```bash
npm i v-api-fetch
```

### Configuração do Plugin no `main.js` ou `main.ts`

O coração da configuração acontece no seu arquivo de entrada, `main.js`. É aqui que você informa ao plugin qual é o endereço da sua API e como ele deve se comportar antes de cada requisição (adicionar tokens) e ao encontrar erros.

1. **Importe o `AxiosPlugin`** do pacote:

```jsx
import { AxiosPlugin } from 'v-api-fetch';
```

1. **Use o plugin** na sua instância do Vue (`app`) com `app.use()`:

```jsx
app.use(AxiosPlugin, {
  // 1. Configurações da URL da API (lidas do ambiente)
  hostApi: import.meta.env.VITE_BASE_URL_API || 'http://localhost:8022',
  subpath: import.meta.env.VITE_SUB_PATH || '',
  baseApi: import.meta.env.VITE_BASE_API || '/api/v1',

  // 2. Interceptor de Requisição: Adiciona o token de autorização
  requestInterceptor: (config) => {
    // Exemplo, pegando o token do keycloak (auth) e passando caso exista.
    const keycloakStore = useKeycloakStore();

    if (keycloakStore.token) {
      // Adiciona o cabeçalho 'Authorization' em todas as chamadas
      config.headers["Authorization"] = `Bearer ${keycloakStore.token}`;
    }

    return config;
  },

  // 3. Interceptor de Erro: Lida com falhas na API (Opcional)
  // função que pode ser adicionada para interceptar erros e fazer algo com eles
  errorInterceptor: createErrorInterceptor(),
});
```

exemplo de errorInterceptor:

```jsx
import { useToastStoreLimited } from "@/stores/useToastStoreLimited";
import { useToastStore } from "@/stores/useToastStore";

function handleError(error) {
  let finalMessage = "Ocorreu um erro inesperado.";
  let errorTitle = "Erro";

  if (error.request && !error.response) {
    errorTitle = "Erro de Conexão";
    finalMessage = "Não foi possível conectar ao servidor. A aplicação pode estar offline ou sua rede está com problemas.";
  } else if (error.response) {
    const status = error.response.status;
    errorTitle = `Erro ${status}`;
    const errorData = error.response.data;

    if (errorData && 'message' in errorData) {
        if (typeof errorData.message === 'string') {
            finalMessage = errorData.message;
        } else if (Array.isArray(errorData.message)) {
            finalMessage = errorData.message.map(m => 
                typeof m === 'object' ? Object.values(m).join(', ') : m
            ).join('\n');
        } else if (typeof errorData.message === 'object' && errorData.message !== null) {
            finalMessage = Object.entries(errorData.message)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('\n');
        }
    }
  }
  return { finalMessage, errorTitle };
}

function chooseToastStore(toastLimited) {
  if (toastLimited === true) {
    return useToastStoreLimited();
  } else {
    return useToastStore();
  }
}

// Esta é a função que será passada para o plugin no main.js
export function createErrorInterceptor() {
  return (error) => {
    if (error.config?.showToast === false) {
      return Promise.reject(error);
    }

    const path = window.location.pathname;
    if (!path.startsWith("/panel")) {
      return Promise.reject(error);
    }

    const { finalMessage, errorTitle } = handleError(error);
    const toastStore = chooseToastStore(error.config?.toastLimited);
    
    toastStore.showToast(errorTitle, finalMessage, 2);

    return Promise.reject(error);
  };
}
```

### Detalhes da Configuração

- **`hostApi`, `subpath`, `baseApi`**: Estas opções constroem a URL base para todas as suas chamadas. Usar variáveis de ambiente (`import.meta.env`) é uma excelente prática, pois permite configurar diferentes URLs para ambientes de desenvolvimento e produção.
- **`requestInterceptor`**: Esta função é executada **antes** de cada requisição ser enviada, no exemplo mostrado, ela busca o token de autenticação no `useKeycloakStore` e o anexa aos cabeçalhos. Isso centraliza a lógica de autenticação, garantindo que todas as chamadas de API sejam autenticadas.
- **`errorInterceptor`**: Esta função é executada sempre que uma chamada de API falha. Ao delegar a lógica para uma função externa (`createErrorInterceptor`), você mantém seu `main.ts` mais limpo e organizado. Essa função é responsável por formatar a mensagem de erro e exibir uma notificação (toast) para o usuário ou qualquer nova lógica que queira adicionar.

## Setup

Para utilizar, primeiro importe o `composable` no seu componente Vue.

```jsx
import { useApiFetch } from 'v-api-fetch';
```

## Uso Básico

A forma mais simples de usar o `useApiFetch` é passando apenas o path da Url do endpoint. Ele automaticamente fará a requisição e retornará o estado da chamada.

```jsx
<script setup>
import { useApiFetch } from 'v-api-fetch';

const { data: newsList, pending, error } = useApiFetch('newsAll/');
</script>

<template>
  <div v-if="pending">Carregando notícias...</div>
  <div v-else-if="error">Ocorreu um erro: {{ error.message }}</div>
  <ul v-else>
    <li v-for="news in newsList" :key="news.id">{{ news.title }}</li>
  </ul>
</template>
```

## Valores Retornados

O `composable` retorna um objeto com as seguintes propriedades reativas:

| Propriedade | Tipo | Descrição |
| --- | --- | --- |
| `data` | `Ref<any>` | O corpo da resposta da API (ex: `response.data`). O valor inicial é `null`. |
| `pending` | `Ref<boolean>` | Um booleano que indica se a requisição está em andamento. O valor inicial é `true`. |
| `error` | `Ref<any>` | Contém o objeto de erro caso a requisição falhe. O valor inicial é `null`. |
| `execute` | `Function` | Uma função `async` para re-executar a chamada à API manualmente. |

> 💡 Dica: Se você usar múltiplos useApiFetch no mesmo componente, renomeie as variáveis para evitar conflitos:
> 

```jsx
const { data: data_1 , pending: pending_1, error: error_1 } = useApiFetch('newsAll/')
const { data: data_2 , pending: pending_2, error: error_2 } = useApiFetch('newsAll/')
```

## Opções

Você pode passar um segundo argumento para o `useApiFetch` com um objeto de opções para customizar o comportamento da chamada.

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `params` | `Object | Function | Computed` | Um objeto de parâmetros a ser enviado na URL da requisição (query string). Pode ser reativo.       (já é reativo por padrão) |
| `transform` | `Function` | Uma função para modificar os dados brutos da API  `data`. |
| `onResponse` | `Function` | Um "hook" executado quando a chamada é bem-sucedida. Consegue acessar: `response`, `request` e `options`. |
| `onResponseError` | `Function` | Um "hook" executado quando a chamada falha. Consegue acessar: `error`, `request` e `options`. |
| `watch` | `Array<Ref | Function>` | Um array de fontes reativas para observar. Qualquer mudança em uma dessas fontes irá disparar um `refetch`. |
| `paramsReactives` | `Boolean` | (Padrão: `true`) Um interruptor para desativar a reatividade automática do objeto `params`. |
| `apiOptions` | `AxiosRequestConfig` | tudo que for mandado para apiOptions será repassado para a requisição `AXIOS`,  ex: caso queria passar algum cabeçalho para a requisição |
| `initialData` | `any` | Valor default para o `data`, ex: começar com um vetor vazio até que uma resposta seja retornada |

## Exemplos de Opções

### `transform`

Use para limpar, formatar ou extrair apenas a parte dos dados que lhe interessa.

```jsx
// O endpoint retorna { count: 2, results: [...] }
// Queremos que `userList` seja apenas o array `results`, mas com dados formatados.

const { data: userList } = useApiFetch('/users', {
  transform: (apiResponse) => {
    // Retorna apenas o array 'results', transformando cada item
    return apiResponse.results.map(user => ({
      id: user.id,
      fullName: `${user.first_name} ${user.last_name}`,
      statusText: user.status_code === 1 ? 'Ativo' : 'Inativo',
      registeredDate: new Date(user.created_at).toLocaleDateString('pt-BR')
    }));
  }
});
```

### `data default`

```jsx
const { data: productList, pending } = useApiFetch('/products', {
  initialData: [] 
});
```

### `onResponse` e `onResponseError`

Use para executar "efeitos colaterais" após a chamada, como atualizar outras `refs` ou `stores`.

```jsx
const proximo = ref(null);
const anterior = ref(null);

const { data: newsItem } = useApiFetch(`news/${route.params.id}/`, {
  onResponse: ({ response }) => {
    // Atualiza outras refs com dados de paginação que vêm na resposta
    proximo.value = response.data.proximo;
    anterior.value = response.data.anterior;
  },
  onResponseError: ({ error }) => {
    console.error("Erro ao carregar notícia:", error);
    // Limpa as refs em caso de erro
    proximo.value = null;
    anterior.value = null;
  }
});
```

## ⚙️ Reatividade: Como Refazer a Chamada Automaticamente

Existem 3 formas de fazer o `useApiFetch` ser reativo e refazer a chamada quando um dado muda.

### 1. Reatividade na URL

Se a própria URL for reativa (uma `ref` ou `computed`), o `fetch` será refeito sempre que ela mudar.

```jsx
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const newsId = computed(() => `news/${route.params.id}/`);

const { data: newsItem } = useApiFetch(newsId);
```

### 2. Reatividade Automática via `params`

Este é o comportamento padrão. Se você passar um `ref`, `computed` ou `reactive` para a opção `params`, qualquer mudança nele irá disparar um `refetch`.

```jsx
import { computed } from 'vue';

const pagination = reactive({ search: '', current_page: 1 });

const apiParams = computed(() => ({
  search: pagination.search,
  page: pagination.current_page,
}));

// O fetch será refeito sempre que `pagination.search` ou `pagination.current_page` mudar.
const { data } = useApiFetch('newsAll/', {
  params: apiParams
});
```

### 3. Reatividade Explícita via `watch`

Use a opção `watch` para informar um array de fontes reativas que devem ser observadas. É ideal para controle granular ou para observar fontes que não estão nos `params`.

> ⚠️ Importante: Para observar propriedades de um objeto reativo (como pagination), você deve passá-las como uma função getter: () => pagination.search.
> 

```jsx
const { data } = useApiFetch('newsAll/', {
  watch: [
    () => pagination.current_page,
    () => pagination.search,
  ]
});
```

### 4. Reatividade Granular (Avançado)

Em casos onde você quer passar um objeto de parâmetros completo, mas quer que o `refetch` aconteça apenas por mudanças em **algumas** chaves, use o seguinte padrão:

1. Passe `params` como uma função getter para sempre enviar os dados mais recentes.
2. Desative a reatividade automática com `paramsReactives: false`.
3. Forneça as fontes reativas que **devem** disparar o `refetch` no array `watch`.

```jsx
const { data } = useApiFetch('newsAll/', {
  // 1. Fornece os dados mais recentes quando o fetch é executado
  params: () => ({
    page: pagination.current_page,
    page_size: 10,
    search: pagination.search,
    filter: pagination.filter,
  }),

  // 2. Desliga a "escuta" automática do objeto params
  paramsReactives: false, 

  // 3. Define explicitamente o que deve ser escutado para refazer a chamada
  watch: [
    () => pagination.current_page,
    () => pagination.search,
  ]
});
```

## 🔄 Refazendo a Chamada Manualmente (Refetching)

Após realizar uma ação que modifica os dados no servidor (como criar, editar ou deletar um item), é essencial atualizar a lista de dados exibida na tela para refletir essa mudança.

O `useApiFetch` oferece duas maneiras principais para acionar um "refetch": uma **manual** (usando a função `execute`) e uma **reativa** (usando um "gatilho").

### Abordagem 1: Manual com `execute`

Esta é a abordagem mais direta. O `composable` retorna uma função `execute` que você pode chamar a qualquer momento para refazer a requisição com os parâmetros mais recentes.

1. **Obtenha a função `execute`** ao desestruturar o retorno do `useApiFetch`.
2. **Chame `execute()`** sempre que uma ação for concluída com sucesso.

```html
<script setup>
import { AxiosPlugin } from 'v-api-fetch';
import MyModal from '@/components/MyModal.vue';

const { data: items, pending, error, execute } = useApiFetch('items/');

const deleteItem = async (itemId) => {
  try {
    await api.delete(`items/${itemId}/`);
    toast.showToast("Sucesso", "Item deletado com sucesso!");
    
    // Chama execute() para atualizar a lista
    execute(); 
  } catch (err) {
    toast.showToast("Erro", "Falha ao deletar o item.");
  }
};
</script>

<template>
  <MyModal @saved="execute" />
</template>
```

- **Prós:** Simples e direto.
- **Contras:** É um estilo mais "imperativo" (você *manda* a busca acontecer). Pode levar a chamadas repetidas de `execute()` em vários lugares do seu código.

### Abordagem 2: Reativa com "Gatilho" (⭐ RECOMENDADO)

Esta é a maneira mais limpa e "Vue" de lidar com o problema. Em vez de chamar uma função, você cria uma variável reativa (`ref`) que funciona como um gatilho. Você adiciona esse gatilho ao `watch` do `useApiFetch` e, para refazer a busca, você simplesmente altera o valor do gatilho.

### Passo 1: Crie o Gatilho Reativo

No seu `<script setup>`, crie um `ref` que servirá como um contador ou interruptor.

```jsx
import { ref } from 'vue';

const refetchTrigger = ref(0);
```

### Passo 2: Adicione o Gatilho ao `watch`

Passe o `refetchTrigger` para o array `watch` na sua chamada `useApiFetch`.

```jsx
const { data: items, pending, error } = useApiFetch('items/', {
  // ... outras opções como params
  watch: [refetchTrigger]
});
```

### Passo 3: Dispare o Gatilho para Refazer a Busca

Agora, em vez de chamar `execute()`, você simplesmente incrementa o valor do gatilho. O `watch` interno do `composable` detectará a mudança e fará o resto.

```jsx
const deleteItem = async (itemId) => {
  try {
    await api.delete(`items/${itemId}/`);
    toast.showToast("Sucesso", "Item deletado com sucesso!");
    
    // Apenas incrementa o gatilho. O watch cuidará do refetch.
    refetchTrigger.value++;
  } catch (err) {
    toast.showToast("Erro", "Falha ao deletar o item.");
  }
};

// É uma boa prática criar uma função para centralizar o disparo
const handleDataUpdate = () => {
  refetchTrigger.value++;
};
```

No template, você usaria a função `handleDataUpdate`:

```html
<template>
  <MyModal @saved="handleDataUpdate" />
</template>
```

### Quando Usar Cada Abordagem?

> 💡 Regra geral: Prefira sempre a abordagem reativa com gatilho.
> 
- **Use a Abordagem Manual (`execute`)** quando:
    - A lógica é muito simples e você só precisa refazer a busca em um único lugar.
    - Você precisa usar `await execute()` para garantir que a nova busca terminou antes de prosseguir com outra lógica.
- **Use a Abordagem Reativa (Gatilho)** quando:
    - Várias ações diferentes (criar, editar, deletar, limpar filtros) precisam acionar uma atualização.
    - Você quer um código mais limpo, declarativo e desacoplado. Os componentes filhos não precisam saber da existência da função `execute`, eles apenas emitem um evento genérico, e o pai decide se deve ou não disparar o gatilho.

## ⚙️ `useApi`

### O que é o `useApi`?

O `useApi` é um composable que te dá acesso **direto e imediato** à instância do Axios que foi configurada pelo `AxiosPlugin` no `main.ts`.

Diferente do `useApiFetch`, ele não gerencia estados de `pending`, `error` ou `data`. Ele simplesmente te entrega a ferramenta (`api`) para que você possa fazer qualquer tipo de requisição (`POST`, `DELETE`, `PUT`, `PATCH`, etc.) com total controle.

### Quando Usar?

Use o `useApi` sempre que você precisar **executar uma ação** no servidor, em vez de apenas buscar dados para exibição.

- Para **criar** um novo recurso (`POST`).
- Para **atualizar** um recurso existente (`PUT` ou `PATCH`).
- Para **deletar** um recurso (`DELETE`).
- Para `GET`s que são ações.

### Como Usar

**1. Importe e instância**
No seu `<script setup>`, importe o `useApi` e chame-o para obter a instância do Axios.

```jsx
import { useApi } from 'v-api-fetch';

const api = useApi();
```

**2. Execute as Ações**
Agora você pode usar a variável `api` para chamar qualquer método do Axios. É uma boa prática sempre envolvê-los em um bloco `try...catch` para lidar com possíveis erros.

**Exemplo de DELETE:**

```jsx
const deleteItem = async (itemId) => {
  try {
    // Envia uma requisição DELETE para o endpoint
    await api.delete(`items/${itemId}/`);
    // Mostra uma notificação de sucesso
    toast.showToast("Sucesso", "Item deletado!");
  } catch (err) {
    // Mostra uma notificação de erro
    toast.showToast("Erro", "Falha ao deletar o item.");
  }
};
```

Exemplo de POST (para criar um novo item):

```jsx
const createItem = async (newItemData) => {
  try {
    // Envia os dados (newItemData) via POST
    await api.post('items/', newItemData);
    toast.showToast("Sucesso", "Item criado com sucesso!");
  } catch (err) {
    toast.showToast("Erro", "Falha ao criar o item.");
  }
};
```

### Padrão de Uso Comum: Ação (`useApi`) + Atualização (`useApiFetch`)

O padrão de uso mais comum é combinar os dois composables. Você usa o `useApiFetch` para buscar e exibir uma lista, e o `useApi` para realizar ações que modificam essa lista. Após a ação ser concluída com sucesso, você chama a função `execute` (do `useApiFetch`) para atualizar os dados na tela.

**Exemplo Completo:**

```jsx
<script setup>
import { useApiFetch, useApi } from 'v-api-fetch';
import { useToastStore } from '@/stores/useToastStore';

// 1. Para buscar e exibir a lista de itens
const { data: items, execute } = useApiFetch('items/');

// 2. Para executar ações (deletar, criar, etc.)
const api = useApi();
const toast = useToastStore();

const deleteItem = async (itemId) => {
  try {
    // 3. Usa o `useApi` para realizar a ação
    await api.delete(`items/${itemId}/`);
    toast.showToast("Sucesso", "Item deletado com sucesso!");
  } catch (err) {
    toast.showToast("Erro", "Falha ao deletar o item.");
  } finally {
    // 4. Usa o `execute` do `useApiFetch` para atualizar a lista na tela
    execute();
  }
};
</script>
```

Este padrão garante que sua interface de usuário esteja sempre sincronizada com os dados do servidor.

### Criar nova Instância

talvez você precise de usar mais de uma api, assim as requisições serão feitas para urls diferentes, isso pode ser resolvido simplesmente criando uma nova Instância nomeada

### 🏭 Criar nova Instância

Talvez você precise usar mais de uma API, fazendo com que as requisições sejam feitas para URLs diferentes. Isso pode ser resolvido simplesmente criando uma nova **Instância Nomeada**.

O `AxiosPlugin` configura a sua API principal (padrão), enquanto a função `createApiInstance` permite registrar quantas APIs adicionais você precisar, cada uma com seu próprio nome, URL e interceptadores.

### Exemplo no `main.ts`

Primeiro, configure o plugin principal normalmente. Depois, importe e chame `createApiInstance` para cada API adicional.

```jsx
import { AxiosPlugin, createApiInstance } from 'v-api-fetch';

const app = createApp(App);

// --- 1. INSTÂNCIA PRINCIPAL (PADRÃO) ---
// Será acessada por padrão ou pelo nome 'api'
app.use(AxiosPlugin, {

  // Configurações da API, lidas do ambiente
  hostApi: import.meta.env.VITE_BASE_URL_API || 'http://localhost:8022',
  subpath: import.meta.env.VITE_SUB_PATH || '',
  baseApi: import.meta.env.VITE_BASE_API || '/api/v1',
  requestInterceptor: (config) => { /* ... */ },
  errorInterceptor: createErrorInterceptor(),
});

// --- 2. INSTÂNCIA ADICIONAL NOMEADA ---
// Função de criação de Instância
createApiInstance(app,
  {
    name: 'alguma-api',
    hostApi: import.meta.env.VITE_BASE_URL_API_2 || 'http://localhost:8025',
    subpath: import.meta.env.VITE_SUB_PATH_2 || '',
    baseApi: import.meta.env.VITE_BASE_API_2 || '/api/v1',
		requestInterceptor: (config) => { /* ... */ },
    errorInterceptor: createErrorInterceptor(),
  }

)
```

### Como Usar a Nova Instância

Uma vez que a instância nomeada é criada (`'alguma-api'` no exemplo acima), você pode acessá-la em qualquer componente passando o nome dela como o **último argumento** para os composables `useApi` e `useApiFetch`.

### Usando com `useApiFetch`

Para buscar dados de uma instância específica, informe o nome dela.

```jsx
<script setup>
import { useApiFetch } from 'v-api-fetch';

// Busca dados da API principal (padrão)
const { data: defaultData } = useApiFetch('/users');

// Busca dados da API nomeada 'alguma-api'
const { data: iceiData } = useApiFetch('/cursos', {}, 'alguma-api');
</script>
```

### Usando com `useApi`

O mesmo princípio se aplica para realizar ações (`POST`, `DELETE`, etc.).

```jsx
<script setup>
import { useApi } from 'v-api-fetch';

// Obtém a instância principal para ações gerais
const api = useApi();
await api.post('/posts', { title: 'Novo Post' });

// Obtém a instância 'alguma-api' para ações específicas
const iceiApi = useApi('alguma-api');
await iceiApi.delete('/cursos/123');
</script>
```


### Adicionado na versão 1.3.0

Agora é possível não executar imediatamente a requisição, o uso é simples e intuitivo:

```html
<script setup>
import { useApiFetch } from 'v-api-fetch';


const {data: defaultData, pending, error, execute} = useApiFetch('/users'{
  immediate: false
});


</script>
```