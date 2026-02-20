import { FC, ReactNode } from "react";

/**
 * These types act as the "Fallback" if the user doesn't provide their own.
 */
export interface DefaultTypeRegistry {
  element: ReactNode;
  icon: FC<{
    color?: string;
    size?: number;
    className?: string;
  }>;
  valid_path: string;
  resource_key: string;
}

/**
 * TYPE REGISTRY
 * This interface is EMPTY by default.
 * TypeScript will look here first.
 */
export interface TypeRegistry {}

/** ==========================================
 * EXPORTED CONVENTIONS
 * ========================================== */

// Logic: Use the user's TypeRegistry key IF it exists, otherwise use the Default.
export type ElementType = TypeRegistry extends { element: infer E }
  ? E
  : DefaultTypeRegistry["element"];

export type IconType = TypeRegistry extends { icon: infer I }
  ? I
  : DefaultTypeRegistry["icon"];

export type ValidPath = TypeRegistry extends { valid_path: infer P }
  ? P
  : DefaultTypeRegistry["valid_path"];

export type ResourceKey = TypeRegistry extends { resource_key: infer R }
  ? R
  : DefaultTypeRegistry["resource_key"];
