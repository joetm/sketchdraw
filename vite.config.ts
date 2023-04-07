import { defineConfig, loadEnv } from 'vite'


export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd())
  return {
    define: {
      // 'process.env': env,
      'process.env.VITE_REPLICATE_API_TOKEN': JSON.stringify(env.VITE_REPLICATE_API_TOKEN),
    },
    root: './src',
    build: {
      outDir: '../dist',
      minify: false,
      emptyOutDir: true,
    },
  }
})

