# @schema-first/core

## 0.2.1

### Patch Changes

- Fixed issue where 0.2.0 was actually identical to 0.1.0. See 0.2.0 for changes.

## 0.2.0

### Minor Changes

- Add APIAction to exports. It was wrongly excluded before now.

## 0.1.0

### Minor Changes

- feat: minor usability improvements
  - createSpec: withFilters now defaults to !!e.restURL
  - createSpec: sortable logic excludes negative types like -longtext
  - createSpec: filterSpec array items now have optional type
  - APIAction: fix reloadMode assignment logic
  - defaults: SORTABLE_FIELDS now includes negative types
  - types: filterSpec array type allows optional type property
