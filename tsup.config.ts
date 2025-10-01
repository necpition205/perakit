import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      main: 'src/main/main.ts'
    },
    outDir: 'dist/main',
    format: ['cjs'],
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    clean: false,
    dts: false,
    minify: false,
    external: ['electron', 'frida']
  },
  {
    entry: {
      preload: 'src/preload.ts'
    },
    outDir: 'dist/preload',
    format: ['cjs'],
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    clean: false,
    dts: false,
    minify: false,
    external: ['electron', 'frida']
  }
]);

