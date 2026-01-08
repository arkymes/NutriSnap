import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid type errors if @types/node is missing
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env to support existing code structure
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {} 
    }
  };
});