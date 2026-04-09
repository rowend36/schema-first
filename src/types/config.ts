import { ColumnSpec, ColumnType, DataSpec } from ".";
import { APIAction } from "../core/APIAction";
import type {
  IconType,
  ValidPath,
  ResourceKey,
  ElementType,
} from "./type-conventions";

export interface ActionConfigEntry {
  label: string;
  icon?: IconType;
  color?: string;
}

export type ActionConfig = Record<
  "create" | "update" | "delete" | "resource" | "default",
  ActionConfigEntry
>;

export interface SpecConventions {
  UNIMPLEMENTED_PLACEHOLDER: ElementType;
  actions: ActionConfig;
  fetch: (
    url: string,
    method: APIAction["method"],
    body: object | undefined,
  ) => Promise<{
    status: "success" | "failure";
    data?: any;
    error?: string;
  }>;
  loadSpec: (name: ResourceKey) => DataSpec;
  SORTABLE_FIELDS: (
    | ColumnType
    | `-${ColumnSpec["stringType"]}`
    | `-${ColumnSpec["numberType"]}`
  )[];
  labels: {
    getLabelFromKey: (key: string) => string;
    getLabelFromURL: (label: string | undefined, url: string | null) => string;
    getSingularLabelFromURL: (
      pluralLabel: string,
      path: ValidPath | null,
    ) => string;
  };
  auto_pages: {
    getRouteForResource: (spec: DataSpec) => string | null;
    getPageTitle: (spec: DataSpec) => string;
    getViewPageTitle: (spec: DataSpec) => string;
  };
  urls: {
    normalizeURL: (url: string) => string;
    getDetailURL: (url: ValidPath, id: string | number) => string;
    getActionURL: (url: ValidPath, action: string) => string;
  };
}
