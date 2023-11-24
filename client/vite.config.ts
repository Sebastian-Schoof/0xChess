import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
    root: "client",
    build: { outDir: "../build/dist" },
    css: { modules: { localsConvention: "camelCaseOnly" } },
    plugins: [preact(), tsconfigPaths(), EnvironmentPlugin({ PORT: null })],
});
