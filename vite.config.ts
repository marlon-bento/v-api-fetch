import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'


export default defineConfig({
  plugins: [vue(),
  dts({
    tsconfigPath: './tsconfig.json',
    rollupTypes: true,
    outDir: 'dist' 
  })
  ],
  build: {
    lib: {
      // Múltiplos pontos de entrada
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
      },
      // O nome é menos importante aqui, mas pode ser mantido
      name: 'VSistecFeatures',
      // Os formatos que você quer gerar
      formats: ['es'] // 'es' (ES Module) é o mais importante para Vite
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        // Garante que os arquivos de saída mantenham a estrutura de pastas
        entryFileNames: '[name].js',
        // Para o formato UMD, se você usar
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})