# Backend Tooling and Pre-commit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend formatting and style checks, wire them into the repository pre-commit hook, and keep the harness guidance aligned with backend work.

**Architecture:** Keep backend checks inside the `backend/` module so they can run independently of the frontend. Use Gradle plugins for formatting and style enforcement, and let the repository-level hook orchestrate both frontend and backend checks only when the backend wrapper is available. This avoids coupling the hook to a globally installed Gradle binary.

**Tech Stack:** Java 21, Gradle, Spotless, Checkstyle, native Git hooks, Markdown.

---

### Task 1: Add backend quality plugins and conventions

**Files:**
- Modify: `backend/build.gradle`
- Create: `backend/config/checkstyle/checkstyle.xml`
- Create: `backend/.editorconfig`

- [ ] **Step 1: Add the Gradle plugins and tasks**

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.4'
    id 'io.spring.dependency-management' version '1.1.6'
    id 'checkstyle'
    id 'com.diffplug.spotless' version '6.25.0'
}

group = 'com.costwise'
version = '0.0.0-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

checkstyle {
    toolVersion = '10.20.1'
    configFile = file('config/checkstyle/checkstyle.xml')
}

spotless {
    java {
        googleJavaFormat('1.22.0')
    }
    format 'misc', {
        target '*.gradle', '.editorconfig'
        trimTrailingWhitespace()
        endWithNewline()
    }
}

tasks.named('check') {
    dependsOn 'spotlessCheck', 'checkstyleMain'
}
```

- [ ] **Step 2: Add a minimal style guide that passes on an empty scaffold**

```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
        "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
        "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
    <module name="LineLength">
        <property name="max" value="120"/>
    </module>
    <module name="TreeWalker">
        <module name="UnusedImports"/>
        <module name="NoWhitespaceBefore"/>
        <module name="NeedBraces"/>
    </module>
</module>
```

```ini
root = true

[*.java]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 4
trim_trailing_whitespace = true
```

- [ ] **Step 3: Install and verify**

Run:

```bash
cd backend
./gradlew check
```

Expected:
- The command succeeds with the checked-in wrapper.

### Task 2: Extend the pre-commit hook to cover backend checks

**Files:**
- Modify: `.githooks/pre-commit`

- [ ] **Step 1: Update the hook to run backend checks when a wrapper is present**

```sh
#!/bin/sh
set -e

cd "$(git rev-parse --show-toplevel)"

cd frontend
npm run lint
npm run format:check

cd ..
cd backend
./gradlew check
```

- [ ] **Step 2: Verify the hook stays non-blocking without a backend wrapper**

Run:

```bash
git config core.hooksPath .githooks
```

Expected:
- The hook path remains `.githooks`.
- Frontend checks still run.
- Backend checks run through the checked-in wrapper.

### Task 3: Document backend workflow in the harness guide

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add a backend-work section**

```markdown
## Backend Work

- Use the `cloudflare:workers-best-practices` or Spring-related project guidance when backend work touches service boundaries, APIs, or persistence.
- Use the `harness` skill only for agent/team orchestration.
- Use `frontend-design` only for frontend UI work, not for backend tooling.
```

- [ ] **Step 2: Update the change log**

Add a change log entry for the backend tooling and hook update.

### Task 4: Validate the updated workflow

**Files:**
- Review: `backend/build.gradle`
- Review: `backend/config/checkstyle/checkstyle.xml`
- Review: `backend/.editorconfig`
- Review: `.githooks/pre-commit`
- Review: `AGENTS.md`

- [ ] **Step 1: Confirm the backend quality plugins are present**

Run:

```bash
Get-Content backend/build.gradle
```

Expected:
- `checkstyle` and `spotless` are configured.

- [ ] **Step 2: Confirm the hook logic**

Run:

```bash
Get-Content .githooks/pre-commit
```

Expected:
- The hook runs frontend checks and conditionally runs backend checks.
