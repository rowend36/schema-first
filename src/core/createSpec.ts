import type {
  CellRenderer,
  ColumnSpec,
  ColumnType,
  DataSpec,
  DynamicDataSpec,
  RawColumnSpec,
  RawDataSpec,
} from "../types";

import { createPermissionSpec } from "./permissions";
import { getRenderer } from "./registerRenderer";
import { defaultValidator } from "./validation";
import { getConventions } from "./config";
import { APIAction } from "./APIAction";
const None = {};
const renderCell: CellRenderer = (props) => {
  return getRenderer(props.spec, "table")(props);
};
const renderForm: CellRenderer = (props) => {
  return getRenderer(props.spec, "form")(props);
};
const renderShow: CellRenderer = (props) => {
  return getRenderer(props.spec, "view")(props);
};

const renderInline: CellRenderer = (props) => {
  return getRenderer(props.spec, "inline")(props);
};

export function getDefaults(spec: DataSpec) {
  return Object.values(spec.columns).reduce((a, e) => {
    if (e.default !== undefined) a[e.key] = e.default;
    return a;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as any);
}

export function inferFilterType(res: ColumnSpec) {
  switch (res.type) {
    case "boolean":
      return {
        ...res,
        canView: res.canView,
        canUpdate: res.canList,
        showOnForm: true,
        type: "string",
        options: {
          true: { label: "Yes" },
          false: { label: "No" },
        },
      } as ColumnSpec;
    case "string":
    case "reference":
      return {
        ...res,
        canView: res.canView,
        canUpdate: res.canList,
        showOnForm: true,
      } as ColumnSpec;
    case "datetime":
    case "number":
      return createColumnSpec(
        {
          type: "range",
          rangeType: res,
          canView: res.canView,
          canUpdate: res.canList,
        },
        res.key,
      );
    case "list":
      return res.listType;
    case "range":
      return res.rangeType;
    case "file":
    case "image":
      return createColumnSpec(
        {
          type: "boolean",
          canCreate: res.canCreate,
          canView: res.canView,
          label: "Has " + res.label,
        },
        res.key,
      );
    default:
      console.log(res);
      throw new Error("No filter type defined for " + res.type);
  }
}

function _getAPIActions() {
  const { actions } = getConventions();
  return {
    Create: new APIAction({
      method: "POST",
      detail: false,
      form: true,
      icon: actions.create.icon,
      label: actions.create.label,
      defaultColor: actions.create.color,
      canExecute(user, spec, data) {
        return spec.canCreate(user);
      },
    }),
    Update: new APIAction({
      method: "PATCH",
      detail: true,
      form: true,
      icon: actions.update.icon,
      label: actions.update.label,
      defaultColor: actions.update.color,
      reloadMode: "partial",
      canExecute(user, spec, data) {
        return spec.canUpdate(user);
      },
    }),
    Delete: new APIAction({
      method: "DELETE",
      confirmationText: "Delete this item?",
      detail: true,
      label: actions.delete.label,
      icon: actions.delete.icon,
      defaultColor: actions.delete.color,
      canExecute(user, spec, data) {
        return spec.canDelete(user);
      },
    }),
  };
}

const ref = new WeakMap();
function getAPIActions() {
  const { actions } = getConventions();
  if (ref.has(actions)) {
    return ref.get(actions);
  } else {
    const m = _getAPIActions();
    ref.set(actions, m);
    return m;
  }
}

export function createSpec<T extends string>(
  e: RawDataSpec<T>,
  { withFilters = false } = {},
): DataSpec<T> {
  const {
    actions,
    labels: { getLabelFromURL, getSingularLabelFromURL },
  } = getConventions();
  const APIActions = getAPIActions();
  const pluralLabel = e.pluralLabel ?? getLabelFromURL(e.label, e.restURL);

  const filters: ColumnSpec[] = [];
  const columns = (
    Object.entries(e.columns) as Array<[T, RawColumnSpec | ColumnType | null]>
  ).reduce(
    (acc, [f, val]) => {
      if (val === null) return acc;
      const res = createColumnSpec<T>(val, f);
      if (res.filterable) {
        if (typeof val === "string" || !val.filterSpec) {
          if (withFilters) filters.push(inferFilterType(res));
        } else if (Array.isArray(val.filterSpec)) {
          for (const item of val.filterSpec) {
            filters.push(createColumnSpec(item.type, item.key));
          }
        } else filters.push(createColumnSpec(val.filterSpec, f));
      }
      acc[f] = res;
      return acc;
    },
    {} as DataSpec<T>["columns"],
  );
  const specs = Object.values<ColumnSpec<T>>(columns);
  const pk = specs.find(
    (e) => e.stringType === "pk" || e.numberType === "pk",
  )?.key;
  // if (!pk) {
  //   throw new Error("No primary key found in spec");
  // }
  return {
    ...e,
    filterSpec:
      filters.length === 0
        ? undefined
        : {
            columns: filters.reduce(
              (acc, res) => {
                acc[res.key] = res;
                return acc;
              },
              {} as DataSpec["columns"],
            ),
          },
    tableColumns: specs.filter((e) => e.showOnTable).map((e) => e.key),
    icon: e.icon === undefined ? actions.resource.icon : e.icon,
    createAction: e.createAction ?? APIActions.Create,
    updateAction: e.updateAction ?? APIActions.Update,
    meta: e.meta ?? None,
    pk: pk!,
    label: e.label ?? getSingularLabelFromURL(pluralLabel, e.restURL),
    pluralLabel,
    urlLookup: e.urlLookup ?? pk!,

    columns,
    slots: inferSlots<T>(e, specs, pk!),
    actions:
      e.actions ?? (e.readOnly ? [] : [APIActions.Delete, APIActions.Update]),
    ...createPermissionSpec(e),
  };
}

function inferSlots<T extends string>(
  e: RawDataSpec<T>,
  specs: ColumnSpec<T>[],
  pk: T,
) {
  const usedSlots = e.slots
    ? Object.values(e.slots).concat(e.slots.others ?? [])
    : [];
  const inferredSlots = {
    avatar:
      e.slots?.avatar ??
      specs.find(
        (e) =>
          e.showOnView &&
          !usedSlots.includes(e.key) &&
          e.type === "image" &&
          e.imageType === "avatar",
      )?.key,
    content:
      e.slots?.content ??
      specs.find(
        (e) =>
          e.showOnView &&
          !usedSlots.includes(e.key) &&
          e.type === "string" &&
          e.stringType === "longtext",
      )?.key,
    image:
      e.slots?.image ??
      specs.find(
        (e) =>
          e.showOnView &&
          !usedSlots.includes(e.key) &&
          e.type === "image" &&
          e.imageType === "banner",
      )?.key,
    title:
      e.slots?.title ??
      specs.find(
        (e) =>
          e.showOnView &&
          !usedSlots.includes(e.key) &&
          e.type === "string" &&
          e.stringType !== "longtext" &&
          !e.options &&
          e.stringType !== "pk",
      )?.key,
    timestamp:
      e.slots?.timestamp ??
      specs.find(
        (e) =>
          e.showOnView && !usedSlots.includes(e.key) && e.type === "datetime",
      )?.key,
    rating:
      e.slots?.rating ??
      specs.find(
        (e) =>
          e.showOnView &&
          !usedSlots.includes(e.key) &&
          e.type === "number" &&
          e.numberType === "rating",
      )?.key,

    ...e.slots,
  };
  const inferredSlotKeys = Object.values(inferredSlots);
  return {
    others:
      inferredSlots.others ??
      specs
        .filter(
          (e) =>
            e.showOnView && !inferredSlotKeys.includes(e.key) && e.key !== pk,
        )
        .map((e) => e.key),
    ...inferredSlots,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defaultSelect(this: ColumnSpec, data: any) {
  return data?.[this.key];
}

function defaultSelectMeta(this: RawColumnSpec) {
  return this.meta ?? None;
}
function getter<T>(e: T) {
  return () => e;
}
function loader(spec: DynamicDataSpec) {
  const { loadSpec } = getConventions();
  let cached: DataSpec;
  return () =>
    cached
      ? cached
      : (cached = spec.extends
          ? { ...loadSpec(spec.base), ...spec.extends }
          : loadSpec(spec.base));
}

function createColumnSpec<T extends string>(
  val: RawColumnSpec | ColumnType,
  f: T,
): ColumnSpec<T> {
  const {
    SORTABLE_FIELDS,
    labels: { getLabelFromKey },
  } = getConventions();
  if (typeof val == "string") {
    val = {
      type: val,
    };
  }
  let listType = val.type === "list" ? val.listType : undefined;
  if (listType) {
    listType = createColumnSpec(listType, "item");
  }
  let rangeType =
    val.type === "range" ? (val.rangeType ?? "number") : undefined;
  if (rangeType) {
    rangeType = createColumnSpec(rangeType, "item");
  }
  const rawReferenceSpec = val.referenceSpec;
  const completions = val.completions;
  const referenceMode: ColumnSpec["referenceMode"] =
    val.type === "reference"
      ? (val.referenceMode ??
        (!completions
          ? typeof rawReferenceSpec === "function" ||
            // @ts-expect-error We know what we are doing
            rawReferenceSpec?.restURL ||
            // @ts-expect-error We know what we are doing
            rawReferenceSpec?.extends?.restURL
            ? "api-relation"
            : "object-relation"
          : "id-relation"))
      : undefined!;
  const referenceSpec = rawReferenceSpec
    ? typeof rawReferenceSpec === "function"
      ? rawReferenceSpec
      : "base" in rawReferenceSpec
        ? loader(rawReferenceSpec)
        : getter(createSpec(rawReferenceSpec))
    : undefined!;
  if (val.type === "reference" && !referenceSpec) {
    throw new Error(
      `Reference spec for ${f} is not defined. Please provide a DataSpec or use a number or string field.`,
    );
  }
  const stringType =
    val.type && val.type !== "string"
      ? undefined!
      : (val.stringType ?? (f === "id" ? "pk" : "text"));
  const numberType =
    val.type === "number"
      ? (val.numberType ?? (f === "id" ? "pk" : "integer"))
      : undefined!;
  return {
    key: f,
    label: val.label ?? getLabelFromKey(f),
    // Type
    type: val.type || "string",
    stringType,
    numberType,
    dateType:
      val.type === "datetime" ? (val.dateType ?? "datetime") : undefined!,
    imageType: val.type === "image" ? (val.imageType ?? "banner") : undefined!,
    boolType:
      val.type === "boolean" ? (val.boolType ?? "checkbox") : undefined!,
    listType: listType as ColumnSpec,
    rangeType: rangeType as ColumnSpec,
    referenceMode,
    referenceSpec,

    // Value Helpers
    default: val.default,
    select: val.select || defaultSelect,
    options: val.options ?? undefined!,
    completions: completions
      ? typeof completions === "function"
        ? completions
        : getter(createSpec(completions, { withFilters: false }))
      : undefined!,
    ["meta" as never]: val.meta || undefined!,
    selectMeta: val.selectMeta ?? defaultSelectMeta,

    // Validation
    validate: val.validate ?? defaultValidator,
    validationRules: val.validationRules ?? {},
    required: val.required ?? true,

    // Rendering
    group: val.group ?? "default",
    showOnTable: val.showOnTable ?? val.showOnView ?? val.type !== "hidden",
    showOnForm: val.showOnForm ?? (!val.readOnly && val.type !== "hidden"),
    showOnView: val.showOnView ?? val.type !== "hidden",
    searchable:
      (val.type === "string" && stringType !== "pk") ||
      (val.type === "list" && !!listType?.searchable),
    filterable:
      val?.filterable ??
      ((val.type === "string" && stringType === "shorttext") ||
        (val.type === "list" && !!listType?.searchable)),
    sortable:
      val.sortable ?? (SORTABLE_FIELDS.includes(val.type) ? "both" : false),
    renderTable: val.renderTable ?? renderCell,
    renderForm: val.renderForm ?? renderForm,
    renderShow: val.renderShow ?? renderShow,
    renderInline: val.renderInline ?? renderInline,

    // Permissions
    ...createPermissionSpec(
      (stringType ?? numberType) === "pk" ? { readOnly: true, ...val } : val,
    ),
  };
}
