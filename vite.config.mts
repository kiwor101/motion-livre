import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';

export default defineConfig({
  plugins:[vue()],
  define:{'process.env.NODE_ENV':'"production"'},
  build:{outDir:'ui-dist',emptyOutDir:true,lib:{entry:resolve(import.meta.dirname,'src/ui/main.ts'),formats:['es'],fileName:()=> 'motion-ui.js'}}
});
