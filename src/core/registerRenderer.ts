import type {
  CellRenderer,
  ColumnSpec,
  ColumnType,
  RegisteredRenderer,
} from "../types";
import { getConventions } from "./config";

const renderers: Map<ColumnType, RegisteredRenderer[]> = new Map();
export const HIDDEN_RENDERERS = renderers;
/* It is important that this call is only made in a useEffect Hook and cleared afterwards */

let cache: WeakMap<
  ColumnSpec,
  Partial<Record<RegisteredRenderer["view"], CellRenderer>>
> | null = null;
export function registerRenderer(
  type: ColumnType,
  renderer: RegisteredRenderer,
) {
  let x = renderers.get(type);
  if (!x) {
    x = [];
    renderers.set(type, x);
  }
  x.unshift(renderer);
  cache = null;
  return () => {
    const i = x.indexOf(renderer);
    if (i >= 0) {
      x.splice(i, 1);
      cache = null;
    }
  };
}

function unimplementedRenderer({ spec }: { spec: ColumnSpec }) {
  const { UNIMPLEMENTED_PLACEHOLDER } = getConventions();
  console.warn(
    "No renderer found for this field: ",
    spec,
    getRenderer(spec, "table"),
  );
  return UNIMPLEMENTED_PLACEHOLDER;
}

export function getRenderer(
  spec: ColumnSpec,
  view: RegisteredRenderer["view"],
  fallbacks = true,
): CellRenderer {
  if (!cache) cache = new WeakMap();
  const _cached = cache.get(spec);
  const _cachedView = _cached?.[view];
  if (_cachedView) return _cachedView;
  const x = renderers.get(spec.type) ?? [];
  const res =
    x.find((e) => {
      return view === e.view && (!e.test || e.test(spec));
    })?.renderer ??
    (fallbacks
      ? view === "inline"
        ? (getRenderer(spec, "table", false) ??
          getRenderer(spec, "view", false))
        : view === "view"
          ? (getRenderer(spec, "inline", false) ??
            getRenderer(spec, "table", false))
          : view === "table"
            ? (getRenderer(spec, "inline", false) ??
              getRenderer(spec, "view", false))
            : null
      : null) ??
    (fallbacks ? unimplementedRenderer : null!);
  if (!_cached)
    cache.set(spec, {
      [view]: res,
    });
  else _cached[view] = res;
  return res;
}
