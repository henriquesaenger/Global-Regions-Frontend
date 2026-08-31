import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(
  process.env.VOLTO_FRONTEND_PATH || path.resolve(root, '../frontend'),
);
const volto = path.resolve(frontend, 'core/packages/volto');

export default defineConfig({
  root,
  resolve: {
    alias: {
      '@plone/volto': path.resolve(
        frontend,
        'core/packages/volto/src',
      ),
      react: path.resolve(frontend, 'node_modules/react'),
      'react-dom': path.resolve(frontend, 'node_modules/react-dom'),
      'react-redux': path.resolve(volto, 'node_modules/react-redux'),
      redux: path.resolve(volto, 'node_modules/redux'),
      '@testing-library/react': path.resolve(
        volto,
        'node_modules/@testing-library/react',
      ),
    },
  },
  define: {
    __CLIENT__: 'true',
    __SERVER__: 'false',
    __DEV__: 'true',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/index.js'],
    },
  },
});
