import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      insertTypesEntry: true,
      entryRoot: 'src',
      cleanVueFileName: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'WheelFortune',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['gsap'],
      output: {
        globals: {
          gsap: 'gsap',
        },
      },
      plugins: [
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true,
            dead_code: true,
            reduce_vars: true,
            reduce_funcs: true,
          },
          mangle: {
            toplevel: true,
            keep_fnames: false,
          },
          format: {
            comments: false,
          },
        }),
      ],
    },
  },
  server: {
    open: true,
    port: 3000,
  },
});
