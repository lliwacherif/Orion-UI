# NPM Scripts Reference

This document describes all available npm scripts and their usage.

## Development Scripts

### `npm run dev`

**Purpose**: Start the development server with hot module replacement (HMR)

**What it does:**
- Starts Vite dev server on `http://localhost:3000`
- Enables hot module replacement (instant updates)
- Provides source maps for debugging
- Watches for file changes

**Usage:**
```bash
npm run dev
```

**Expected output:**
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Troubleshooting:**
- **Port in use**: Change port in `vite.config.ts` or kill process on port 3000
- **Module not found**: Run `npm install`
- **TypeScript errors**: Check `tsconfig.json` and file imports

---

## Build Scripts

### `npm run build`

**Purpose**: Create optimized production build

**What it does:**
- Compiles TypeScript to JavaScript
- Bundles React application
- Minifies code
- Optimizes assets
- Outputs to `dist/` directory

**Usage:**
```bash
npm run build
```

**Output location**: `dist/`

**Build size** (approximate):
- JavaScript: ~150 KB (gzipped)
- CSS: ~10 KB (gzipped)
- Total: ~160 KB

**Troubleshooting:**
- **TypeScript errors**: Fix type errors before building
- **Build fails**: Check dependencies are installed
- **Large bundle**: Review imports, consider code splitting

---

### `npm run preview`

**Purpose**: Preview production build locally

**What it does:**
- Serves the `dist/` directory
- Simulates production environment
- Useful for testing before deployment

**Usage:**
```bash
npm run build
npm run preview
```

**Expected output:**
```
➜  Local:   http://localhost:4173/
➜  Network: use --host to expose
```

**Note**: Must run `npm run build` first

---

## Linting Scripts

### `npm run lint`

**Purpose**: Check code for linting errors

**What it does:**
- Runs ESLint on TypeScript files
- Checks for code quality issues
- Reports unused imports
- Validates React hooks rules

**Usage:**
```bash
npm run lint
```

**Fix issues automatically:**
```bash
npm run lint -- --fix
```

**Common issues:**
- Unused variables
- Missing dependencies in useEffect
- Incorrect hook usage
- Import order issues

---

## Custom Scripts (Add to package.json)

### Type Checking

Add to `package.json`:
```json
"scripts": {
  "type-check": "tsc --noEmit"
}
```

**Usage:**
```bash
npm run type-check
```

**Purpose**: Check TypeScript types without building

---

### Format Code

**Install Prettier:**
```bash
npm install -D prettier
```

Add to `package.json`:
```json
"scripts": {
  "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\""
}
```

**Usage:**
```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

---

### Clean Build

Add to `package.json`:
```json
"scripts": {
  "clean": "rm -rf dist node_modules",
  "clean:cache": "rm -rf .vite node_modules/.cache"
}
```

**Usage:**
```bash
npm run clean        # Remove build and dependencies
npm run clean:cache  # Clear Vite cache
```

---

## Verification Scripts

### Setup Verification

**Usage:**
```bash
node verify-setup.js
```

**Purpose**: Verify project setup is correct

**Checks:**
- Required files exist
- Dependencies installed
- Environment configured
- Package.json valid

---

## Common Workflows

### Fresh Start

Reset everything and reinstall:
```bash
rm -rf node_modules package-lock.json dist .vite
npm install
npm run dev
```

### Production Build and Test

Build and preview production version:
```bash
npm run build
npm run preview
```

### Fix Linting Issues

Check and fix code issues:
```bash
npm run lint
npm run lint -- --fix
```

### Update Dependencies

Check for outdated packages:
```bash
npm outdated
```

Update to latest:
```bash
npm update
```

Update specific package:
```bash
npm install react@latest
```

---

## Environment-Specific Runs

### Development with custom port

Edit `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,  // Custom port
    host: true,  // Expose to network
  },
})
```

### Production build with analysis

Install bundle analyzer:
```bash
npm install -D rollup-plugin-visualizer
```

Update `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ],
})
```

Run build:
```bash
npm run build
```

Opens bundle analysis in browser.

---

## CI/CD Scripts

### GitHub Actions Example

Create `.github/workflows/build.yml`:
```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

### Docker Build

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build:
```bash
docker build -t aura-ui .
docker run -p 8080:80 aura-ui
```

---

## Performance Scripts

### Measure Build Time

```bash
time npm run build
```

### Analyze Bundle Size

```bash
npm run build
du -sh dist
ls -lh dist/assets
```

### Check Dependencies Size

```bash
npm install -g cost-of-modules
cost-of-modules
```

---

## Debugging Scripts

### Debug with Source Maps

Development already includes source maps. To debug production build:

Add to `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    sourcemap: true,  // Enable for production
  },
})
```

### Verbose Logging

```bash
DEBUG=vite:* npm run dev
```

---

## Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm install` | Install dependencies | First setup, after pulling changes |
| `npm run dev` | Start dev server | During development |
| `npm run build` | Production build | Before deployment |
| `npm run preview` | Test production build | After building |
| `npm run lint` | Check code quality | Before committing |
| `node verify-setup.js` | Verify setup | After cloning project |

---

## Tips

1. **Always run `npm install`** after pulling new changes
2. **Run `npm run lint`** before committing
3. **Test with `npm run build`** before deploying
4. **Clear cache** (`rm -rf .vite`) if seeing stale data
5. **Check `package-lock.json`** into git for reproducible builds

---

## Troubleshooting Commands

### Reset Everything
```bash
rm -rf node_modules package-lock.json dist .vite
npm install
```

### Clear Vite Cache
```bash
rm -rf .vite node_modules/.vite
```

### Fix Lock File
```bash
rm package-lock.json
npm install
```

### Check for Errors
```bash
npm run lint
npx tsc --noEmit
```

---

**Last Updated**: October 2025

