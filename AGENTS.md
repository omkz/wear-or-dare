# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router application. Route pages live in `app/` (for example, `app/photo/page.tsx`), while API handlers live under `app/api/**/route.ts`. Shared React components belong in `components/`; reusable UI primitives go in `components/ui/`, and landing-page-specific sections go in `components/landing/`. Keep shared types, utilities, and temporary data in `lib/`. Static images and icons are served from `public/`. Global Tailwind styles and design tokens are defined in `app/globals.css`.

Use the `@/` alias for imports from the repository root rather than long relative paths.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies from `pnpm-lock.yaml`.
- `pnpm dev` starts the local development server at `http://localhost:3000`.
- `pnpm build` creates a production build and catches integration issues.
- `pnpm start` serves the completed production build.
- `pnpm lint` runs ESLint across the repository.
- `pnpm exec tsc --noEmit` performs strict TypeScript checking independently of a full production build.

## Coding Style & Naming Conventions

Write TypeScript and TSX with two-space indentation, double quotes, and no semicolons, matching existing files. Use PascalCase for React components and exported types, camelCase for functions and variables, and kebab-case for component filenames (such as `boldness-indicator.tsx`). Follow Next.js route conventions exactly (`page.tsx`, `route.ts`, and `[id]`). Prefer small functional components, Tailwind utility classes, accessible labels, and `aria-hidden` on decorative icons.

## Testing Guidelines

No automated test runner or coverage threshold is configured. Before submitting changes, run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`, then manually exercise affected routes and API handlers. If adding tests, colocate them as `*.test.ts` or `*.test.tsx` and add the chosen runner to `package.json`.

## Commit & Pull Request Guidelines

History is brief, but includes Conventional Commit-style subjects such as `feat: replace Instagram icon...`. Prefer concise, imperative subjects using `feat:`, `fix:`, `refactor:`, or `docs:`. Keep each commit focused. Pull requests should explain user-visible behavior, list validation performed, link related issues, and include screenshots or recordings for UI changes. Call out API contract, mock-data, or configuration changes explicitly.

## Configuration & Data Safety

API routes currently use placeholder/mock data. Never commit credentials or production user uploads; use environment variables for future service keys and document required variable names without including values.
