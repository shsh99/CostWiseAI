# PR AI Review

This repository can run an automated AI review on pull requests through GitHub Actions.

## What It Does

- Triggers when a pull request is opened, updated, reopened, or marked ready for review.
- Collects the PR metadata and changed files from GitHub.
- Sends the diff and repository rules to OpenAI for review.
- Posts the result back to the PR as a GitHub review.

## Required Secrets

- `OPENAI_API_KEY`: used by the workflow to call the OpenAI Responses API.

## Behavior

- The workflow uses the repository's base branch context, not the pull request branch code.
- If the same commit has already been reviewed by the bot, the run exits early.
- If the model reports blocking issues, the review is submitted with a change-request event.
- Otherwise, the review is submitted as a comment-only review so every PR still receives feedback.

## Safety Rules

- Do not check out or execute untrusted pull request code in the review job.
- Keep the prompt focused on changed files and repository rules.
- Fail clearly if the OpenAI secret is missing.

## Tuning

- `OPENAI_MODEL` can override the default review model.
- If the prompt becomes too large, trim long patches before sending them to the model.
