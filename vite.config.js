import { defineConfig } from "vite";

export default defineConfig({
  base: "/", // مهم برای دامنه اصلی
  build: {
    outDir: "dist",
  },
});
