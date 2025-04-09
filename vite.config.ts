import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",

  build: {
    // Specifies the directory where assets will be placed in the dist folder
    assetsDir: "assets",

    rollupOptions: {
      output: {
        // Custom function to determine how asset files should be named
        assetFileNames: (assetInfo) => {
          // Extract the file extension from the asset name
          let extType = assetInfo.names[0].split(".")[1];

          // If the file is an image (matches the regex pattern)
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "img";
          }

          // Return the final path structure: assets/type/filename-hash.extension
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      },
    },

    sourcemap: true,
  },
});
