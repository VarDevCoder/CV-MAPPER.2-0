import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración mínima de Vite con el plugin de React.
export default defineConfig({
  plugins: [react()],
});
