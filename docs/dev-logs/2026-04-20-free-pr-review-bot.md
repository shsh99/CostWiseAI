# 2026-04-20 Free PR Review Bot

## Context

The repository needs an automatic PR review that always leaves feedback, but the workflow should not depend on paid model calls.

## Alternatives

### A. Free rule-based review bot

- Use GitHub Actions and the GitHub API only.
- Inspect changed files, patches, and repo conventions.
- Post a review on every PR with summary and rule-based findings.

### B. OpenAI-backed review bot

- Use the OpenAI Responses API to generate natural-language feedback.
- Higher flexibility, but it requires a paid secret and external dependency.

## Decision

Chose **A**.

## Why

- It avoids paid API dependency.
- It still guarantees that PRs receive an automated review comment.
- It is predictable and easy to maintain when repository conventions change.
- It keeps the review job safe because it does not execute PR code.

## Validation

- `node --check scripts/ai-pr-review.mjs` passed.
- `git diff --check` showed no patch errors.

## Notes

- The workflow now uses only the GitHub token provided by Actions.
- Heuristics should be updated alongside repository conventions.
