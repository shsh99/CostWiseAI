# Frontend Tooling and Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add frontend lint/format automation, a Git pre-commit hook, and harness guidance for when to use frontend design skills.

**Architecture:** Keep linting and formatting in the `frontend/` package so the frontend can be validated independently, and wire a repository-level pre-commit hook that calls those scripts before commits land. Keep the project guidance short and explicit so UI work naturally triggers the frontend design skill, while tooling/config work does not.

**Tech Stack:** npm, ESLint, Prettier, native Git hooks, Markdown.

---

### Task 1: Define the frontend toolchain

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/eslint.config.mjs`
- Create: `frontend/.prettierrc.json`
- Create: `frontend/.prettierignore`
- Create: `frontend/package-lock.json`

- [ ] **Step 1: Add lint and format scripts**

```json
{
  "name": "finance-platform-frontend",
  "private": true,
  "version": "0.0.0",
  "description": "React frontend skeleton for the finance decision platform",
  "scripts": {
    "lint": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --no-error-on-unmatched-pattern",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint:fix": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --fix --no-error-on-unmatched-pattern"
  },
  "devDependencies": {
    "@eslint/js": "^9.25.1",
    "eslint": "^9.25.1",
    "eslint-config-prettier": "^10.1.2",
    "globals": "^16.0.0",
    "prettier": "^3.5.3"
  }
}
```

- [ ] **Step 2: Add a flat ESLint config for an empty React-ready frontend**

```js
import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-console': 'warn'
    }
  },
  eslintConfigPrettier
];
```

- [ ] **Step 3: Add formatting defaults**

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "none"
}
```

```text
node_modules
dist
build
.codex
docs/superpowers/plans
docs/superpowers/specs
```

- [ ] **Step 4: Install dependencies and verify the scripts**

Run:

```bash
cd frontend
npm install
npm run lint
npm run format:check
```

Expected:
- `npm run lint` exits successfully on the empty scaffold.
- `npm run format:check` exits successfully.

### Task 2: Wire a repository pre-commit hook

**Files:**
- Create: `.githooks/pre-commit`
- Create: `.gitignore`

- [ ] **Step 1: Add the hook script**

```sh
#!/bin/sh
set -e

cd "$(git rev-parse --show-toplevel)"
cd frontend
npm run lint
npm run format:check
```

- [ ] **Step 2: Point Git at the hook directory**

Run:

```bash
git config core.hooksPath .githooks
```

- [ ] **Step 3: Ignore dependency and build outputs**

```gitignore
frontend/node_modules/
frontend/dist/
frontend/build/
backend/build/
```

- [ ] **Step 4: Verify the hook path**

Run:

```bash
git config --get core.hooksPath
```

Expected:
- `.githooks`

### Task 3: Document frontend design-skill usage in the harness guide

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add a frontend-work section**

```markdown
## Frontend Work

- Use the `frontend-design` skill when creating or changing frontend pages, components, layouts, or other user-facing UI.
- Do not use `frontend-design` for linting, formatting, hook setup, package wiring, or other tooling-only changes.
- If the work includes accessibility-sensitive UI decisions, pair `frontend-design` with `accessible-ui-guidelines`.
```

- [ ] **Step 2: Update the change log**

Add a change log entry for the frontend tooling and workflow update.

### Task 4: Validate the workflow

**Files:**
- Review: `frontend/package.json`
- Review: `frontend/eslint.config.mjs`
- Review: `frontend/.prettierrc.json`
- Review: `.githooks/pre-commit`
- Review: `AGENTS.md`

- [ ] **Step 1: Run the frontend checks manually**

Run:

```bash
cd frontend
npm run lint
npm run format:check
```

Expected:
- Both commands succeed.

- [ ] **Step 2: Simulate a commit path**

Run:

```bash
git config core.hooksPath .githooks
git status --short
```

Expected:
- The hook path is set.
- No unexpected files are modified by validation.
