import type { ColumnSpec } from "../types";

export const defaultValidator: ColumnSpec["validate"] = async (
  e,
  key,
  spec,
  partial,
) => {
  if (key! in e || e[key] === null || (spec.required && !partial)) {
    return "This field is required";
  }
  return null;
};
