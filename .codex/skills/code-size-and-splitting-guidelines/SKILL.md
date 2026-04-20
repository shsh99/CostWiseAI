---
name: code-size-and-splitting-guidelines
description: Use when editing Java(Spring) or React code, deciding whether to split a file, reviewing class/method/component size, or refactoring services, hooks, and components based on SRP and line-count thresholds.
---

# Code Size and Splitting Guidelines

When this skill triggers, apply the repository rule set in:

- [docs/architecture/code-size-and-splitting-guidelines.md](../../../../docs/architecture/code-size-and-splitting-guidelines.md)

## Default Behavior

- Check class, method, and component size before editing.
- Split by responsibility, not only by line count.
- Prefer smaller services, hooks, and components when logic starts mixing concerns.

## Hard Signals to Split

- Java: class over ~250 lines, method over ~30 lines, or service mixing orchestration with calculation/validation/storage.
- React: component over ~200 lines, too many `useState` hooks, or UI/API/state mixed in one file.
- File-level: `if/else` chains, nested loops, or many local variables suggest the file is doing too much.

## Decision Rule

If a file changes for more than one reason, split it.

