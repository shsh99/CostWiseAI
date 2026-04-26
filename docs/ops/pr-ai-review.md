# PR AI Review

This repository can run an automated rule-based review on pull requests through GitHub Actions.

## What It Does

- Triggers when a pull request is opened, updated, reopened, or marked ready for review.
- Collects the PR metadata and changed files from GitHub.
- Sends the diff to a rule-based review script.
- Posts the result back to the PR as a GitHub review.

## Required Secrets

- None. The review uses only the GitHub token provided to Actions.

## Behavior

- The workflow uses the repository's base branch context, not the pull request branch code.
- If the same commit has already been reviewed by the bot, the run exits early.
- If the rule engine reports blocking issues, the review is submitted with a change-request event.
- Otherwise, the review is submitted as a comment-only review so every PR still receives feedback.

## Safety Rules

- Do not check out or execute untrusted pull request code in the review job.
- Keep the review focused on changed files and repository rules.
- Fail clearly if the GitHub token is missing.

## Tuning

- Update the heuristics in `scripts/ai-pr-review.mjs` when the repository conventions change.
- Keep the rule set small so the bot stays predictable.
