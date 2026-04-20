# 2026-04-20 Swagger Setup

## Context

The backend needs interactive API documentation for local development and review.

## Decision

Use `springdoc-openapi-starter-webmvc-ui` with the Spring Boot 3 backend.

## Why

- It adds Swagger UI with minimal code.
- It works with the existing `spring-boot-starter-web` stack.
- It keeps the change small and focused on developer experience.

## Changes

- Added the Springdoc dependency to the backend build with a version compatible with Spring Boot 3.3.x.
- Allowed Swagger and OpenAPI endpoints in the security filter chain.

## Validation

- Dependency and security-path changes are limited to the backend dev setup.
- The previous springdoc version failed to start with the current Spring Boot 3.3.4 stack.
- Full backend build verification will be run after the patch is staged.
