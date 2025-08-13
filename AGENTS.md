# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: React + Vite app (TypeScript). Source in `src/`, static assets in `public/`.
- `backend/`: NestJS service (TypeScript). Source in `src/`, Jest config in `package.json`, coverage to `backend/coverage/`.
- `packages/shared/`: Shared TypeScript package `@lg/shared` built to `dist/` (CJS/ESM exports).
- Root uses npm workspaces; Node 18+ required (`"engines": { "node": ">=18" }`).

## Build, Test, and Development Commands
- Root build all workspaces: `npm run build` (runs `build -ws`).
- Dev (frontend): `npm run dev:fe` → start Vite dev server.
- Dev (backend): `npm run dev:be` → Nest start in watch mode.
- Dev (shared): `npm run dev:shared` → build once, then watch CJS builds.
- Install deps: `npm i` (postinstall builds `@lg/shared`).
- Test (backend unit): `npm run test -w backend`.
- Test watch/coverage: `npm run test:watch -w backend`, `npm run test:cov -w backend`.
- Lint: `npm run lint -w frontend`, `npm run lint -w backend`; format (backend): `npm run format -w backend`.

## Coding Style & Naming Conventions
- TypeScript across repo; prefer 2‑space indentation.
- React components: PascalCase filenames (`ChatPanel.tsx`); variables/functions: camelCase; constants: UPPER_SNAKE_CASE.
- Backend files: feature-based folders under `src/`; tests colocated or in `test/` per Nest conventions.
- Linting via ESLint (frontend/backend). Backend uses Prettier for formatting.

## Testing Guidelines
- Framework: Jest (backend). Unit tests end with `.spec.ts` (regex `.*.spec.ts`).
- Aim for meaningful coverage on services and controllers; check report in `backend/coverage/`.
- Run e2e (if present): `npm run test:e2e -w backend`.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat: add chat message list`, `fix(backend): handle 500 on /health`).
- PRs: include summary, linked issues (e.g., `Closes #123`), screenshots for UI changes, and test notes. Keep changes scoped per workspace.

## Security & Configuration Tips
- Do not commit secrets; use environment variables (`.env.local`, `.env`) and add examples only.
- Validate Node version (>=18). If build fails, ensure `@lg/shared` is built: `npm run build:shared` or reinstall.
