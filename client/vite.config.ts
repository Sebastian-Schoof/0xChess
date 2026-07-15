import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
    root: "client",
    base: "",
    build: { outDir: "../build/dist", assetsInlineLimit: 0 },
    css: { modules: { localsConvention: "camelCaseOnly" } },
    resolve: { tsconfigPaths: true },
    plugins: [preact({ devToolsEnabled: false })],
});
