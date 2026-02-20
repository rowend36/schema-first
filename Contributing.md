# Contributing to @schema-first/core

First off, thank you for considering contributing to the Spec Engine! It’s people like you who make the admin experience better for everyone.

## 🏗️ Architecture Philosophy

This project is built on three core pillars:

1. **Framework Agnosticism**: Logic must never depend on React, Vue, or Svelte APIs directly.
2. **Type Safety**: Use the `TypeRegistry` for everything. If a user can't override a type via declaration merging, it’s a bug.
3. **Predictability**: `createSpec` should always produce a predictable, hydrated `DataSpec` regardless of how minimal the input `RawDataSpec` is.

---

## 🛠️ Development Setup

1. **Clone the repo:**

```bash
git clone https://github.com/rowend36/schema-first-spec.git
cd schema-first-spec

```

2. **Install dependencies:**

```bash
npm install

```

3. **Build in watch mode:**

```bash
npm run dev

```

---

## 🖇️ Adding New Features

### 1. Adding a New Column Type

If you want to add a new core `ColumnType` (e.g., `markdown` or `geo`):

- Add the key to `DataTypeRegistry` in `src/types/index.ts`.

---

## 🧪 Testing Guidelines

We use a combination of unit tests and type-check tests.

- **Logic Tests**: Ensure `getLabelFromKey` and `normalizeURL` handle edge cases (trailing slashes, camelCase, etc.).
- **Type Tests**: Use `tsd` or `expect-type` to verify that `TypeRegistry` correctly overrides `ElementType` and `IconType`.

---

## 📬 Pull Request Process

1.  **Branching**: Use `feat/` for new features, `fix/` for bug fixes, and `docs/` for documentation.
2.  **Linting**: Ensure `npm run lint` passes. We use strict TypeScript rules.
3.  **Documentation**: If you add a new convention or metadata key, update the `README.md`.
4.  **No Peer Dependency Bloat**: Never add a dependency to `package.json` that isn't a `devDependency` unless it is absolutely essential for the core logic.

---

## 📜 Coding Standards

- **Use Interfaces for Hooks**: Any object that describes metadata should be an `interface` to allow for Declaration Merging.
- **Export Everything**: If a type is used in a public-facing function, it must be exported from `src/index.ts`.

---

## ⚖️ License

By contributing, you agree that your contributions will be licensed under its Apache-2.0 License.
