import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
    },
    define: {
      "import.meta.env.OPENROUTER_API_KEY": JSON.stringify(env.OPENROUTER_API_KEY ?? ""),
    },
  };
});
