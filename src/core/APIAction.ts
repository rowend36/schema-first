import type {
  ColumnSpec,
  DataAction,
  DataSpec,
  IconType,
  PermissionHolder,
} from "../types";
import { hasPermission } from "./permissions";
import type { Permission } from "../types";
import { getConventions } from "./config";
/**
 * {
 *  id : "{id}",
 *  status: "approved"
 * }
 */
export type PreprocessConfig =
  | Record<string, unknown>
  | DataAction["preprocess"];
export function createPreprocessor(config: object) {
  const m = Object.entries(config);
  return (data: unknown, spec: DataSpec<string>) => {
    return m.reduce((a, [key, value]) => {
      a[key] =
        typeof value === "string" && value[0] === "{"
          ? spec.columns[value.slice(1, -1)]?.select(data)
          : value;
      return a;
    }, {} as any);
  };
}

export function createDataAction(
  props: ConstructorParameters<typeof APIAction>[0],
  target = null! as DataAction,
) {
  const {
    actions,
    labels: { getLabelFromKey },
  } = getConventions();
  if (("action" in props || !("execute" in props)) && !target) {
    return new APIAction(props);
  } else if (!target) target = props as DataAction;

  target.icon = props.icon ?? actions.default.icon;
  target.label = props.label ?? getLabelFromKey((props as any).action) ?? "";
  target.defaultColor = props.defaultColor ?? actions.default.color ?? "";

  target.detail = props.detail ?? false;
  target.reloadMode = props.reloadMode ?? (props.detail ? "partial" : true);
  target.bulk = props.bulk ?? false;

  if (target !== props) {
    target.form = props.form;
    target.requiredPermissions = props.requiredPermissions;
    target.preprocess = props.preprocess
      ? typeof props.preprocess === "function"
        ? props.preprocess
        : createPreprocessor(props.preprocess)
      : undefined;
    target.confirmationText = props.confirmationText;
    target.failureResponse = props.failureResponse;
    target.successResponse = props.successResponse;
    target.resultSpec = props.resultSpec;
  }

  target.canExecute =
    props.canExecute && props.canExecute !== hasActionPermissions
      ? props.canExecute
      : props.requiredPermissions && props.requiredPermissions.length
        ? hasActionPermissions
        : undefined;

  if ("execute" in props && props.execute) {
    target.execute = props.execute;
  }
  return target;
}

function hasActionPermissions(this: DataAction, user: PermissionHolder) {
  return hasPermission(user, this.requiredPermissions || []);
}

export class APIAction<T extends object = any> implements DataAction<T> {
  method: "POST" | "PATCH" | "PUT" | "DELETE" | "GET";
  action!: string | undefined;
  icon!: IconType;
  detail?: boolean;
  reloadMode?: boolean | "partial" | undefined;
  label!: string;
  confirmationText?: string | undefined;
  defaultColor?: string | undefined;
  requiredPermissions?: Permission[] | undefined;
  resultSpec?: true | DataSpec<string> | undefined;
  successResponse?: string | undefined;
  failureResponse?: string | undefined;
  form?: true | DataSpec<string> | undefined;
  bulk?: boolean;
  preprocess?: ((data: any) => T) | undefined;
  canExecute?:
    | ((user: PermissionHolder, spec: DataSpec, data: T) => boolean)
    | undefined;

  constructor(
    props: Omit<DataAction, "execute" | "preprocess"> & {
      action?: string;
      execute?: DataAction<T>["execute"];
      preprocess?: PreprocessConfig;
      method?: APIAction["method"];
    },
  ) {
    createDataAction(props as any, this);
    this.action = props.action ?? "";
    this.method = props.method ?? "POST";
  }

  getBody(data: T, spec: DataSpec): unknown {
    if (this.form || this.preprocess) {
      return prepareForUpload(data, spec) as Promise<T>;
    }
    return undefined;
  }
  async execute(
    // The data to submit
    data: T,
    // Decribes the data being supplied, this allows us to do basic lookups such as primary key lookups
    // As well has handle custom data types like images and files
    spec: DataSpec | null = null,
    // For more advanced lookups, you can supply the url directly after resolving all lookups
    // The action property would still be used if and only if it is a relative path without lookups
    resolvedURL: string | null = null,
  ) {
    const {
      fetch,
      urls: { getActionURL, getDetailURL, normalizeURL },
    } = getConventions();
    let url: string;
    if (resolvedURL && this.action && this.action.startsWith("/")) {
      url = resolvedURL;
    } else {
      if (!resolvedURL) {
        resolvedURL = spec?.restURL ?? null;
      }
      console.log("----->");
      if (this.detail) {
        resolvedURL = getDetailURL(
          resolvedURL!,
          spec!.columns[spec!.pk].select(data),
        );
      }
      url = resolvedURL
        ? this.action
          ? // Combine both the action and the resolvedURL
            getActionURL(resolvedURL, this.action)
          : // Normalize the resolved URL
            normalizeURL(resolvedURL)
        : this.action!;
    }

    if (spec && data && url.includes("{" + spec.urlLookup + "}")) {
      url = url.replace(
        "{" + spec.urlLookup + "}",
        spec.columns[spec.pk].select(data),
      );
    }

    try {
      const res = await fetch(
        url,
        this.method,

        spec ? ((await this.getBody(data, spec)) as object) : data,
      );
      return {
        success: res.status == "success",
        successResponse: (res.data as any)?.message,
        error: res.error,
        shouldReload: this.reloadMode,
        rawResponse: res,
      };
    } catch (e) {
      const err = e as Error;
      return {
        success: false,
        error: err.message,
        shouldReload: this.reloadMode,
      };
    }
  }
}

export class SendBodyAPIAction<T extends object = any> extends APIAction<T> {
  constructor(props: ConstructorParameters<typeof APIAction>[0]) {
    if (!("form" in props)) props.form = true;
    super(props);
  }
}

async function prepareForUpload(data: any, spec: ColumnSpec | DataSpec) {
  if (!data) return data;
  if ("columns" in spec) {
    let m;
    for (const i in spec.columns) {
      if (i in data) {
        (m || (m = { ...data }))[i] = await prepareForUpload(
          spec.columns[i].select(data),
          spec.columns[i],
        );
      }
    }
    return m ?? data;
  } else if (spec.type === "image" || spec.type === "file") {
    // File Uploads are strings on the web and objects on mobile
    if (typeof data === "string") {
      return undefined;
    }
    return data;
  } else if (spec.type === "list") {
    return (
      data &&
      (await Promise.all(
        data?.map((e: unknown) => prepareForUpload(e, spec.listType)),
      ))
    );
  } else {
    return data;
  }
}
