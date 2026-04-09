import {
  ElementType,
  IconType,
  ValidPath,
  ResourceKey,
} from "./type-conventions";

export {
  ElementType,
  IconType,
  ValidPath,
  ResourceKey,
} from "./type-conventions";

/** * ==========================================
 * REGISTRY HOOKS
 * ==========================================
 * These interfaces are designed for Declaration Merging.
 * Users can augment them in their local projects to extend the engine.
 */

/**
 * REGISTRY HOOKS
 * Users can augment these interfaces to add strongly-typed metadata keys.
 */
export interface ColumnMetadataRegistry {
  currency: string;
  compactCurrency: boolean;
  foreignKey: string;
  truncate: [number, number];
  sortKey: string;
  cache: boolean;
  rangeLabels: [string, string];
  rangeKeys: [string, string];
  tags: string[];
}

export interface MetadataRegistry {
  sortField: string;
  defaultSort: string;
  multiSort: boolean;
  cache: boolean;
  tags: string[];
}

/**
 * ColumnMetaData: Information used to describe how a specific field behaves.
 * Uses Partial<ColumnMetadataRegistry> to allow for typed expansion.
 */
export type ColumnMetaData = Partial<ColumnMetadataRegistry> & {
  link?: (data: unknown) => string;
  [key: string]: unknown;
};

/**
 * MetaData: Information describing the Resource/Entity as a whole.
 */
export type MetaData = Partial<MetadataRegistry> & {
  [key: string]: unknown;
};

export interface DataTypeRegistry {
  string: string;
  number: number;
  boolean: boolean;
  list: any[];
  range: any;
  reference: any;
  image: string;
  file: string;
  datetime: string | Date;
  hidden: any;
}

export interface StringSubTypes {
  text: any;
  email: any;
  longtext: any;
  link: any;
  password: any;
  address: any;
  "phone-number": any;
  shorttext: any;
  pk: any;
}

/** * PermissionRegistry allows users to narrow 'string' to a specific Union.
 * Example: interface PermissionRegistry { type: 'admin' | 'user' }
 */
export interface PermissionRegistry {
  type: string;
}

/**
 * SlotRegistry defines common UI placeholders.
 * Users can add custom slots like 'footer' or 'sidebar_meta'.
 */
export interface SlotRegistry {
  image: any;
  title: any;
  avatar: any;
  subtitle: any;
  rating: any;
  summary: any;
  status: any;
  content: any;
  timestamp: any;
}

/** ==========================================
 * CORE TYPES
 * ========================================== */

export type ColumnType = keyof DataTypeRegistry;
export type Permission = PermissionRegistry["type"];

export interface PermissionHolder {
  permissions: Permission[];
}

export interface RawPermissionSpec {
  readOnly?: boolean;
  readPermissions?: Permission[];
  listPermissions?: Permission[];
  viewPermissions?: Permission[];
  writePermissions?: Permission[];
  updatePermissions?: Permission[];
  createPermissions?: Permission[];
  deletePermissions?: Permission[];

  allowCreate?: boolean;
  allowDelete?: boolean;
  allowUpdate?: boolean;

  canView?: (e: PermissionHolder, data: unknown) => boolean;
  canList?: (e: PermissionHolder) => boolean;
  canUpdate?: (e: PermissionHolder, data?: unknown) => boolean;
  canDelete?: (e: PermissionHolder, data?: unknown) => boolean;
  canCreate?: (e: PermissionHolder) => boolean;
}

/** ==========================================
 * ACTIONS & RENDERERS
 * ========================================== */

export interface DataActionResponse {
  shouldReload?: boolean | "partial";
  result?: unknown;
  error?: string;
  redirectTo?: string;
  success: boolean;
  successResponse?: string;
  rawResponse?: unknown;
}

export interface DataAction<T = any> {
  icon?: IconType;
  detail?: boolean;
  bulk?: boolean;
  reloadMode?: boolean | "partial";
  label: string;
  confirmationText?: string;
  defaultColor?: string;
  requiredPermissions?: Permission[];
  resultSpec?: DataSpec | true;
  successResponse?: string;
  failureResponse?: string;
  form?: DataSpec | true;
  preprocess?: (data: any, spec: DataSpec) => T;
  execute: (
    data: T,
    spec: DataSpec | null,
    url?: ValidPath | null,
  ) => Promise<DataActionResponse>;
  canExecute?: (user: PermissionHolder, spec: DataSpec, data: T) => boolean;
}

export type CellRendererProps<T = any> = {
  data: T;
  meta: ColumnMetaData;
  spec: ColumnSpec;
  user: PermissionHolder;
  isCreating?: boolean;
};

export type CellRenderer<T = any> = (
  props: CellRendererProps<T>,
) => ElementType;

/**
 * ViewMode: The distinct UI contexts where a field can be rendered.
 */
export type ViewMode = "inline" | "table" | "form" | "view";

/**
 * RegisteredRenderer: A mapping object used by the engine to decide
 * which component to render for a given column spec.
 */
export type RegisteredRenderer = {
  view: ViewMode;
  /**
   * Optional test function to determine if this renderer
   * applies to the current column.
   */
  test?(spec: ColumnSpec): boolean;
  renderer: CellRenderer;
};

/** ==========================================
 * COLUMN & DATA SPECS
 * ========================================== */

export interface RawColumnSpec extends RawPermissionSpec {
  type: ColumnType;
  stringType?: keyof StringSubTypes | (string & {});
  numberType?:
    | "currency"
    | "integer"
    | "decimal"
    | "pk"
    | "rating"
    | (string & {});
  dateType?: "datetime" | "date" | "time" | (string & {});
  boolType?: "checkbox" | "toggle";
  imageType?: "banner" | "avatar";

  listType?: RawColumnSpec | ColumnType;
  rangeType?: RawColumnSpec | ColumnType;

  referenceMode?: "object-relation" | "api-relation" | "id-relation";
  referenceSpec?:
    | RawDataSpec<string>
    | DynamicDataSpec
    | ((data: unknown) => DataSpec);

  options?: Record<string, { label: string; color?: string }>;
  searchable?: boolean;
  filterable?: boolean;
  filterSpec?: RawColumnSpec | { key: string; type?: RawColumnSpec }[];
  sortable?: "asc" | "desc" | "both" | false;
  default?: unknown;
  required?: boolean;
  group?: string;
  showOnTable?: boolean;
  showOnForm?: boolean;
  showOnView?: boolean;
  meta?: ColumnMetaData;
  selectMeta?: (data: unknown) => ColumnMetaData;
  select?: (e: any) => any;

  completions?: RawDataSpec<string> | ((data: unknown) => DataSpec);
  label?: string;
  validationRules?: {
    max?: number | Date;
    min?: number | Date;
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
  };
  validate?: (
    e: any,
    name: string,
    spec: ColumnSpec,
    partial?: boolean,
  ) => Promise<string | null>;

  renderTable?: CellRenderer;
  renderForm?: CellRenderer;
  renderShow?: CellRenderer;
  renderInline?: CellRenderer;
}

export type DynamicDataSpec = {
  base: ResourceKey;
  extends?: Partial<DataSpec>;
};

export interface RawDataSpec<T extends string> extends RawPermissionSpec {
  columns: Record<T, RawColumnSpec | ColumnType | null>;
  restURL: ValidPath | null;
  urlLookup?: string;
  icon?: IconType;
  meta?: MetaData;
  label?: string;
  pluralLabel?: string;
  createAction?: DataAction<unknown>;
  updateAction?: DataAction<unknown>;
  actions?: DataAction[] | null;

  // Extensible Slots
  slots?: {
    [K in keyof SlotRegistry]?: NoInfer<T>;
  } & { others?: NoInfer<T>[] };
}

/** ==========================================
 * FINAL PROCESSED TYPES
 * ========================================== */

export type PermissionSpec<T extends RawPermissionSpec> = Pick<
  T,
  "canView" | "canUpdate" | "canCreate" | "canList" | "canDelete"
> &
  Omit<T, keyof Required<RawPermissionSpec>>;

export type ColumnSpec<T extends string = string> = Omit<
  Required<PermissionSpec<RawColumnSpec>> & { key: T },
  | "listType"
  | "referenceSpec"
  | "rangeType"
  | "meta"
  | "filterSpec"
  | "completions"
> & {
  listType: ColumnSpec;
  rangeType: ColumnSpec;
  completions: (data: unknown) => DataSpec;
  referenceSpec: (data: unknown) => DataSpec;
};

export type DataSpec<T extends string = string> = Required<
  Omit<PermissionSpec<RawDataSpec<T>>, "columns" | "icon">
> & {
  icon: RawDataSpec<T>["icon"];
  tableColumns: T[];
  filterSpec: Pick<DataSpec, "columns"> | undefined;
  columns: Record<T, ColumnSpec<T>>;
  pk: T;
};
