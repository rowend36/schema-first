import { ColumnType, DataSpec, ValidPath, ResourceKey } from "../types"; // Adjust based on your file structure
import sentenceCase from "../utils/sentence_case";
import capitalize from "../utils/capitalize";
import plural, { singular } from "../utils/plural";
import { ActionConfig, SpecConventions } from "../types/config";
import { initializeConventions } from "./config";

export const PRIMARY_COLOR = "#ff7722";
export const ADD_TRAILING_SLASH = true;

export const SORTABLE_FIELDS: ColumnType[] = [
  "boolean",
  "datetime",
  "string",
  "number",
  "reference",
];

/**
 * SPEC REGISTRY STORAGE
 */
let _specs: Record<ResourceKey, DataSpec> = {} as any;

export function preloadSpecs(specs: Record<string, DataSpec>) {
  _specs = specs;
}

export function loadSpec(name: ResourceKey): DataSpec {
  return _specs[name as any];
}
/**
 * URL & PATH LOGIC
 */
function replacePath(url: string, pathHandler: (url: string) => string) {
  let [path, params] = url?.split("?") ?? ["", ""];
  return (
    pathHandler(path.replace(/\/$/, "")) +
    (ADD_TRAILING_SLASH ? "/" : "") +
    (params ? "?" + params : "")
  );
}

export const normalizeURL = (url: string) => replacePath(url, (path) => path);

export const getDetailURL = (url: ValidPath, id: string | number) =>
  replacePath(url as string, (path) => `${path}/${id}`);

export const getActionURL = (url: ValidPath, action: string) =>
  String(action).startsWith("/")
    ? (action as ValidPath)
    : (replacePath(url as string, (path) => `${path}/${action}`) as ValidPath);

export const getRouteForResource = (spec: DataSpec) =>
  spec.restURL ? `/admin${spec.restURL}` : null;

export function getPageTitle(spec: DataSpec) {
  return `Manage ${capitalize(spec.pluralLabel)}`;
}

export function getViewPageTitle(spec: DataSpec) {
  return `${capitalize(spec.label)} Details`;
}

/**
 * LABEL INFERENCE LOGIC
 */
export function getLabelFromURL(
  label: string | undefined,
  url: ValidPath | null,
): string {
  if (label) return plural(label);
  if (!url) return "";

  return (
    (url as string)
      .toLowerCase()
      .replace(/(?:\/$|\/?\?.*$)/, "")
      .split("/")
      .pop()
      ?.replace(/[-_]/g, " ") ?? ""
  );
}

export function getSingularLabelFromURL(
  pluralLabel: string,
  _: ValidPath | null,
) {
  return pluralLabel ? singular(pluralLabel) : pluralLabel;
}

export function getLabelFromKey(key: string) {
  return sentenceCase(
    key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^num_|_id$/i, ""),
  ).replace(/[-_]/g, " ");
}

/**
 * DEFAULT UI ACTION CONFIG
 * Note: Icons are intentionally left out of defaults to keep the core package
 * dependency-free. Users plug icons in via `initializeConventions`.
 */
export const actions: ActionConfig = {
  create: { label: "Add {resource}" },
  update: { label: "Update {resource}" },
  delete: { label: "Delete {resource}", color: "var(--destructive)" },
  default: { label: "" },
  resource: { label: "{resource}" },
};

export const labels: SpecConventions["labels"] = {
  getLabelFromKey,
  getLabelFromURL,
  getSingularLabelFromURL,
};

export const urls: SpecConventions["urls"] = {
  getActionURL,
  getDetailURL,
  normalizeURL,
};

export const auto_pages: SpecConventions["auto_pages"] = {
  getPageTitle,
  getRouteForResource,
  getViewPageTitle,
};

export function addDefaultConventions() {
  initializeConventions({
    UNIMPLEMENTED_PLACEHOLDER: "No renderer found for this field",
    async fetch(url, method, body) {
      const e = await fetch(url, {
        method,
        body: JSON.stringify(body),
      });
      if (e.ok) {
        return {
          status: "success",
          message: e.json(),
        };
      } else {
        return {
          status: "failure",
          error: e.statusText,
        };
      }
    },
    SORTABLE_FIELDS,
    actions,
    auto_pages,
    labels,
    loadSpec,
    urls,
  });
}
