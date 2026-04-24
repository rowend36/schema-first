// src/index.ts

// 1. Export all your Registry and Processed types
export * from "./types";
export * from "./types/type-conventions";

// 2. Export the Convention logic
export * from "./types/config";
export { initializeConventions, getConventions } from "./core/config";

export {
  hasPermission,
  Permissions,
  createPermissionSpec,
} from "./core/permissions";

export {
  getRenderer,
  registerRenderer,
  HIDDEN_RENDERERS,
} from "./core/registerRenderer";

export { createSpec, getCRUDActions } from "./core/createSpec";

export {
  APIAction,
  type PreprocessConfig,
  SendBodyAPIAction,
  createDataAction,
  createPreprocessor,
} from "./core/APIAction";

export {
  addDefaultConventions,
  auto_pages,
  labels,
  preloadSpecs,
  loadSpec,
  urls,
  normalizeURL,
} from "./core/defaults";
