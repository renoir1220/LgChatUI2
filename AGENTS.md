# Repository Guidelines

## Project Structure & Module Organization
Backend NestJS code lives in `backend/`; feature modules sit in `src/features`, shared utilities in `src/shared`, and domain types in `src/types`. The React/Vite app under `frontend/` keeps reusable UI in `src/components/ui`, business flows in `src/features`, and cross-cutting helpers in `src/lib`. Reference patterns reside in `examples/`, product docs in `docs/`, and deploy assets in `release/`. Update the `CLAUDE.md` files whenever you adjust workflows or architecture.

## Build, Test, and Development Commands
Run `npm install` inside both `backend/` and `frontend/` before starting. From the repo root:
- `npm run dev` – spin up backend (3000) and frontend (5173).
- `npm run dev:be` / `npm run dev:fe` – develop services independently.
- `npm run build` – produce both bundles; `npm run build:be` or `npm run build:fe` for focused builds.
- `npm run crm:<mode>` – manage the CRM bridge (`status`, `test`, `enable`, `auto`, `disable`).
Use `npm run ports` or `npm run health` when diagnosing conflicts.

## Coding Style & Naming Conventions
TypeScript strict mode is the baseline—prefer typed DTOs and `zod` schemas, avoid `any`. Maintain two-space indentation, trailing commas, and import ordering per the ESLint/Prettier config. Name Nest providers `*.service.ts` or `*.controller.ts`; React components use PascalCase files, hooks/utilities camelCase. Format with `cd backend && npm run format`, lint with `npm run lint` in both projects.

## Testing Guidelines
Backend suites run on Jest. Co-locate specs as `*.spec.ts`, execute `cd backend && npm run test`, and gather coverage via `npm run test:cov` before merging. End-to-end checks live in `backend/test/` and run with `npm run test:e2e` after MSSQL fixtures load. Frontend contributors should add React Testing Library cases as `*.test.tsx`, mocking network clients so runs stay deterministic.

## Commit & Pull Request Guidelines
Adopt the Conventional Commit prefixes already in history (`feat:`, `fix:`, `docs:`) with concise scopes like `feat(chat): enable SSE retry`. Combine exploratory work locally before pushing. Pull requests must link planning notes or issues, list verification steps, and attach UI evidence (screenshots or short clips). Call out new env vars, CRM toggles, or migration steps and update the relevant `CLAUDE.md` or `docs/` entries.

## Security & Configuration Tips
Keep secrets in untracked `.env` files and follow the templates in `backend/.env.example`. Confirm Node.js 18+ with `node -v` before installing packages. Run `npm run health` prior to reviews to ensure SSE and auth flows respond, and rotate CRM credentials immediately if shared outside secure channels.
