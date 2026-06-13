import fs from "fs";

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");

if (!fs.existsSync("package.json")) {
  console.error("ERREUR: package.json introuvable");
  process.exit(1);
}

fs.copyFileSync("package.json", "package.backup.before-vite.json");

const pkg = readJson("package.json");
pkg.type = pkg.type || "module";
pkg.scripts = pkg.scripts || {};
pkg.scripts.dev = "vite --host 0.0.0.0";
pkg.scripts.build = "vite build";
pkg.scripts.preview = "vite preview --host 0.0.0.0";
writeJson("package.json", pkg);

if (!fs.existsSync("vite.config.ts")) {
  fs.writeFileSync("vite.config.ts", `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`);
}

if (!fs.existsSync("tsconfig.json")) {
  fs.writeFileSync("tsconfig.json", `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": false,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": []
}
`);
}

if (!fs.existsSync("index.html")) {
  fs.writeFileSync("index.html", `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EtherWorld QC</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);
}

console.log("✅ Vite/React configuré sans effacer ton projet.");
console.log("✅ Backup créé: package.backup.before-vite.json");
