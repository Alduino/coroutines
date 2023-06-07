import {defineConfig} from "tsup";

export default defineConfig({
    entry: ["./src/index.ts"],
    outDir: "./dist",
    format: ["cjs", "esm", "iife"],
    dts: true,
    clean: true,
});
