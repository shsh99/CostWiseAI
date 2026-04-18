# Harness Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install a project-local Codex harness for CostWiseAI, with a stable project guide, packaged harness skill, and plugin metadata.

**Architecture:** Keep the repo-level entry points very short and delegate the real workflow to a local `harness` skill under `.codex/skills/harness/`. The project guide files only point to that skill and record the change history. The plugin metadata stays minimal so Codex can discover the harness bundle cleanly.

**Tech Stack:** Markdown, Codex skill metadata, local plugin metadata.

---

### Task 1: Add project entry-point guides

**Files:**
- Create: `AGENTS.md`
- Create: `CODEX.md`

- [ ] **Step 1: Write the project guide content**

```markdown
# AGENTS.md

## Harness

Use the `harness` skill when you need to design or update agent teams, orchestrators, or project-specific skills in this repository.

## Project-local layout

- Generated agents live under `.codex/agents/`
- Generated skills live under `.codex/skills/`
- Codex packaging metadata lives under `.codex-plugin/`

## Working rules

- Prefer Codex CLI for terminal-driven edits and validation.
- Prefer Codex Desktop for visual review or side-by-side inspection.
- Keep the harness pointers short. Do not duplicate the full skill content here.

## Change log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-19 | Initial harness pointer added | Install project-local Codex harness |
```

```markdown
# CODEX.md

See [AGENTS.md](AGENTS.md) for the project-level Codex guide, harness pointers, and working rules.
```

- [ ] **Step 2: Verify the files exist at the repo root**

Run: `Get-ChildItem . -Name`
Expected: `AGENTS.md` and `CODEX.md` appear in the root directory.

- [ ] **Step 3: Commit the new guidance files**

```bash
git add AGENTS.md CODEX.md
git commit -m "docs: add project harness entry points"
```

### Task 2: Install the local harness skill bundle

**Files:**
- Create: `.codex/skills/harness/SKILL.md`
- Create: `.codex/skills/harness/references/agent-design-patterns.md`
- Create: `.codex/skills/harness/references/orchestrator-template.md`
- Create: `.codex/skills/harness/references/qa-agent-guide.md`
- Create: `.codex/skills/harness/references/skill-testing-guide.md`
- Create: `.codex/skills/harness/references/skill-writing-guide.md`
- Create: `.codex/skills/harness/references/team-examples.md`

- [ ] **Step 1: Copy the harness content into the local skill bundle**

Run:

```powershell
Copy-Item -Recurse -Force .\harness_tmp\skills\harness .\.codex\skills\harness
```

This copies:
- `SKILL.md`
- `references/agent-design-patterns.md`
- `references/orchestrator-template.md`
- `references/qa-agent-guide.md`
- `references/skill-testing-guide.md`
- `references/skill-writing-guide.md`
- `references/team-examples.md`

- [ ] **Step 2: Verify the metadata frontmatter is valid**

Run: `Get-Content .codex/skills/harness/SKILL.md -TotalCount 5`
Expected: `name: harness` and a non-empty `description`.

- [ ] **Step 3: Verify the reference docs are present**

Run: `Get-ChildItem .codex/skills/harness/references -Name`
Expected: the six reference Markdown files are present.

### Task 3: Add packaging metadata for discovery

**Files:**
- Create: `.codex-plugin/plugin.json`
- Create: `.codex-plugin/marketplace.json`

- [ ] **Step 1: Write the plugin manifests**

```json
{
  "name": "harness",
  "description": "Codex Agent Team & Skill Architect — Meta-skill that designs agent teams, defines specialized agents, and generates skills for Codex CLI and Codex Desktop workflows. Codex CLI와 Codex Desktop 워크플로우에 맞는 하네스를 구성하고, 전문 에이전트를 정의하며, 스킬을 생성하는 메타 스킬.",
  "version": "1.2.0",
  "author": {
    "name": "robin",
    "url": "https://github.com/revfactory"
  },
  "homepage": "https://github.com/revfactory/harness",
  "repository": "https://github.com/revfactory/harness",
  "license": "Apache-2.0",
  "keywords": [
    "harness",
    "codex",
    "agent-team",
    "skill-architect",
    "meta-skill",
    "orchestration"
  ]
}
```

```json
{
  "name": "harness-marketplace",
  "owner": {
    "name": "revfactory",
    "email": "",
    "url": "https://github.com/revfactory"
  },
  "plugins": [
    {
      "name": "harness",
      "source": "./",
      "description": "Codex 에이전트 팀 & 스킬 아키텍트. 도메인/프로젝트에 맞는 하네스를 구성하고, 전문 에이전트를 정의하며, 에이전트가 사용할 스킬을 생성하는 메타 스킬.",
      "version": "1.2.0"
    }
  ]
}
```

- [ ] **Step 2: Verify the manifests parse as JSON**

Run: `Get-Content .codex-plugin/plugin.json; Get-Content .codex-plugin/marketplace.json`
Expected: both files contain valid JSON and the plugin name is `harness`.

- [ ] **Step 3: Commit the packaging metadata**

```bash
git add .codex-plugin/plugin.json .codex-plugin/marketplace.json
git commit -m "chore: add harness plugin metadata"
```

### Task 4: Add placeholder project-local directories

**Files:**
- Create: `.codex/agents/README.md`
- Create: `.codex/skills/README.md`

- [ ] **Step 1: Add short directory notes**

```markdown
# .codex/agents

Generated agent definitions for this repository live here.
```

```markdown
# .codex/skills

Generated project-local skills for this repository live here.
```

- [ ] **Step 2: Verify the directories are tracked**

Run: `Get-ChildItem .codex -Force`
Expected: `agents` and `skills` directories are present with README files.

- [ ] **Step 3: Commit the directory placeholders**

```bash
git add .codex/agents/README.md .codex/skills/README.md
git commit -m "chore: add codex workspace directories"
```

### Task 5: Validate the harness setup

**Files:**
- Review: `AGENTS.md`
- Review: `CODEX.md`
- Review: `.codex/skills/harness/SKILL.md`
- Review: `.codex-plugin/plugin.json`
- Review: `.codex-plugin/marketplace.json`

- [ ] **Step 1: Check the project guide pointers**

Run: `Get-Content AGENTS.md`
Expected: the harness pointer and change log are short and project-specific.

- [ ] **Step 2: Check the skill bundle structure**

Run: `Get-ChildItem .codex/skills/harness -Recurse -Name`
Expected: `SKILL.md` plus the six reference documents.

- [ ] **Step 3: Check for accidental extra files**

Run: `git status --short`
Expected: only the harness files and plan file are changed.
