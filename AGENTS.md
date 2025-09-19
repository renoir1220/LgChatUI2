# Repository Guidelines

## Project Structure & Module Organization
LgChatUI2 is split into independent backend and frontend projects. backend/ holds the NestJS service with feature-first modules under src/features, shared infrastructure in src/shared, and type contracts in src/types. frontend/ contains the Vite React app with reusable UI primitives in src/components/ui, feature folders under src/features, and the service worker entry in src/sw.ts. Patterns and reference implementations live in examples/, while API documentation sits in docs/ and deployment helpers in release/. Keep the CLAUDE.md files in each directory updated whenever you adjust architecture or workflows.

## Build, Test, and Development Commands
Use **npm run dev** from the repo root for a concurrent backend (localhost:3000) and frontend (localhost:5173) loop, or start them separately with **npm run dev:be** and **npm run dev:fe**. Compile both projects via **npm run build**, or target a side with **npm run build:be** / **npm run build:fe**. Run **npm run health** for quick service checks and **npm run ports** to diagnose port conflicts. CRM bridge utilities live under the **npm run crm:<mode>** family (status, test, enable, auto, disable) when you need to toggle the external integration.

## Coding Style & Naming Conventions
Both projects are TypeScript-first with 2-space indentation; avoid any unless a TODO justifies it. Name files by feature context, such as chat-session.service.ts or infofeed-panel.tsx, keeping utilities camelCase and React components PascalCase. Frontend imports must rely on configured aliases like @/ for sources and @types/ for shared typing, while backend modules use NestJS path mapping. Run **npm run lint** in each project and **npm run format** in backend before submitting changes.

## Testing Guidelines
Backend tests use Jest; colocate unit specs as *.spec.ts beside services or controllers and keep coverage above 70 percent on critical modules. Integration and e2e flows live under backend/test/ and run with **npm run test:e2e**. Frontend behavior relies on React Testing Library in *.test.tsx files that replicate user-facing flows. Stub CRM and network calls through helpers in src/features/shared/services to keep suites deterministic.

## Commit & Pull Request Guidelines
Favor Conventional Commits such as feat:, fix:, and docs: with clear scope lines like feat(chat): enable SSE retry; concise bilingual summaries are welcome. Squash exploratory commits locally before opening a pull request. Pull requests should link issues or planning notes, describe test coverage or screenshots for UI changes, and flag database or CRM configuration steps. Update the relevant CLAUDE.md when architecture or workflow expectations shift.

## Security & Configuration Tips
Store secrets in local .env files and never commit CRM credentials. Verify Node.js version 18 or newer before installing dependencies. When integrating external services, document required keys in docs/ with sanitized examples. Treat SSE and authentication changes cautiously because regressions impact the live chat experience for every team.
