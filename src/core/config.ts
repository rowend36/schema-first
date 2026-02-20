import type { SpecConventions } from "../types/config";

let _activeConventions: SpecConventions | null = null;

/**
 * Merges your defaults with the user's custom icons/logic.
 */
export function initializeConventions(userConfig: SpecConventions) {
  _activeConventions = userConfig;
}

/**
 * The "Hook" for the rest of your package logic.
 */
export function getConventions(): SpecConventions {
  if (!_activeConventions) {
    // We can return the defaults as a fallback if you don't want to throw
    // But since 'actions' needs icons, throwing is safer.
    throw new Error(
      "@schema-first/core: initializeConventions must be called at root."
    );
  }
  return _activeConventions;
}
