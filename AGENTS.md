# Repository Guidelines
## 也要参考CLAUDE.md的内容

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

## ESLint & Formatting
- Frontend ESLint: `frontend/eslint.config.js`
  - Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended-latest, `eslint-plugin-react-refresh` (Vite integration).
  - Targets: `**/*.{ts,tsx}`; browser globals; ignores `dist`.
  - How to run: `npm run lint -w frontend` (auto-fix: `npm run lint -w frontend -- --fix`).
  - TypeScript constraints that affect lint/build (tsconfig.app.json):
    - `verbatimModuleSyntax: true`: types必须使用 type-only 导入（示例：`import type { ReactElement } from 'react'`）。
    - `noUnusedLocals/noUnusedParameters: true`: 未使用的变量/参数会报错；确需保留请使用前缀 `_` 或移除。
    - `noUncheckedSideEffectImports: true`: 禁止纯副作用导入；请显式使用导出或在注释说明并调整导入方式。
    - `moduleResolution: bundler`, `allowImportingTsExtensions: true`: ESM 风格导入；如导入 `.ts` 扩展需显式带上扩展，且优先使用路径别名 `@/`。
    - Hooks 规则：确保 `useEffect/useCallback` 依赖完整且稳定；不要在条件中调用 Hooks。

- Backend ESLint: `backend/eslint.config.mjs`
  - Extends: `@eslint/js` recommended，`typescript-eslint` recommendedTypeChecked，`eslint-plugin-prettier/recommended`（以 Prettier 为准）。
  - Language options: Node + Jest 全局；`parserOptions.projectService: true`（类型感知规则生效）。
  - Custom rules:
    - `@typescript-eslint/no-explicit-any`: off（允许 any，但优先使用明确类型）。
    - `@typescript-eslint/no-floating-promises`: warn（Promise 必须 await/return/void）。
    - `@typescript-eslint/no-unsafe-argument`: warn（注意 any 传参的安全性）。
  - How to run: `npm run lint -w backend`；格式化：`npm run format -w backend`（Prettier 驱动）。

### Practical Guidelines
- Imports
  - 前端开启 `verbatimModuleSyntax`：类型用 `import type { ... }`；值用正常 `import { ... }`。不要从类型位置导入值，反之亦然。
  - 使用 ESM 导入；避免错误的默认导入。遵循 `@/` 别名结构。
- Unused code
  - 移除未使用的变量/参数/导入。必要时参数命名为 `_e`, `_ctx` 表示有意未用。
- Promises
  - 后端避免悬空 Promise：`await doTask()` 或 `void doTask()`（明确忽略）。
- Formatting
  - 后端以 Prettier 为准；不要手动调整与 Prettier 冲突的风格。提交前运行格式化。
- React
  - Hooks 依赖数组保持完整；使用稳定引用（`useMemo/useCallback`）避免不必要渲染。

### Common Fix Patterns
- Type-only 导入：`import type { ReactElement } from 'react'`（修复 TS1484）。
- 未使用参数：改名为 `_req`/`_res` 或删除。
- 悬空 Promise：`await` 或 `void` 处理返回值。
- 导入顺序与命名：按值/类型分离导入，避免同名遮蔽。
