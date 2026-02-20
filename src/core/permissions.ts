import type {
  PermissionHolder,
  PermissionSpec,
  RawPermissionSpec,
} from "../types";

export function hasPermission(
  e: PermissionHolder,
  permissions: string[] | undefined,
): boolean {
  return permissions
    ? !permissions.length || permissions.some((f) => e.permissions.includes(f))
    : true;
}

function defaultAllowedHandler() {
  return true;
}
function defaultForbiddenHandler() {
  return false;
}

export const Permissions = {
  ALWAYS: defaultAllowedHandler,
  NEVER: defaultForbiddenHandler,
};

function defaultCreateHandler(
  this: PermissionSpec<RawPermissionSpec>,
  user: PermissionHolder,
) {
  // @ts-expect-error Hidden properties
  return hasPermission(user, this.createPermissions);
}

function defaultUpdateHandler(
  this: PermissionSpec<RawPermissionSpec>,
  user: PermissionHolder,
) {
  // @ts-expect-error Hidden properties
  return hasPermission(user, this.updatePermissions);
}
function defaultDeleteHandler(
  this: PermissionSpec<RawPermissionSpec>,
  user: PermissionHolder,
) {
  // @ts-expect-error Hidden properties
  return hasPermission(user, this.deletePermissions);
}
function defaultListHandler(
  this: PermissionSpec<RawPermissionSpec>,
  user: PermissionHolder,
) {
  // @ts-expect-error Hidden properties
  return hasPermission(user, this.listPermissions);
}
function defaultViewHandler(
  this: PermissionSpec<RawPermissionSpec>,
  user: PermissionHolder,
) {
  // @ts-expect-error Hidden properties
  return hasPermission(user, this.viewPermissions);
}

export function createPermissionSpec(
  val: RawPermissionSpec,
): Required<PermissionSpec<RawPermissionSpec>> {
  return {
    // @ts-expect-error - Hidden Keys
    createPermissions: val.createPermissions || val.writePermissions,
    canCreate:
      val.canCreate &&
      val.canCreate !== defaultCreateHandler &&
      val.canCreate !== Permissions.ALWAYS &&
      val.canCreate !== Permissions.NEVER
        ? val.canCreate
        : val.readOnly === true || val.allowCreate === false
          ? Permissions.NEVER
          : (val.createPermissions || val.writePermissions)?.length
            ? defaultCreateHandler
            : val.readOnly === false || val.allowCreate === true
              ? Permissions.ALWAYS
              : (val.canCreate ?? Permissions.ALWAYS),
    updatePermissions: val.updatePermissions || val.writePermissions,
    canUpdate:
      val.canUpdate &&
      val.canUpdate !== defaultUpdateHandler &&
      val.canUpdate !== Permissions.ALWAYS &&
      val.canUpdate !== Permissions.NEVER
        ? val.canUpdate
        : val.readOnly === true || val.allowUpdate === false
          ? Permissions.NEVER
          : (val.updatePermissions || val.writePermissions)?.length
            ? defaultUpdateHandler
            : val.readOnly === false || val.allowUpdate === true
              ? Permissions.ALWAYS
              : (val.canUpdate ?? Permissions.ALWAYS),
    deletePermissions: val.deletePermissions || val.writePermissions,
    canDelete:
      val.canDelete &&
      val.canDelete !== defaultDeleteHandler &&
      val.canDelete !== Permissions.ALWAYS &&
      val.canDelete !== Permissions.NEVER
        ? val.canDelete
        : val.readOnly === true || val.allowDelete === false
          ? Permissions.NEVER
          : (val.deletePermissions || val.writePermissions)?.length
            ? defaultDeleteHandler
            : val.readOnly === false || val.allowDelete === true
              ? Permissions.ALWAYS
              : (val.canDelete ?? Permissions.ALWAYS),
    listPermissions: val.listPermissions || val.readPermissions,
    canList:
      val.canList &&
      val.canList !== defaultListHandler &&
      val.canList !== Permissions.ALWAYS &&
      val.canList !== Permissions.NEVER
        ? val.canList
        : (val.listPermissions || val.readPermissions)?.length
          ? defaultListHandler
          : (val.canList ?? Permissions.ALWAYS),
    viewPermissions: val.viewPermissions || val.readPermissions,
    canView:
      val.canView &&
      val.canView !== defaultViewHandler &&
      val.canView !== Permissions.ALWAYS &&
      val.canView !== Permissions.NEVER
        ? val.canView
        : (val.viewPermissions || val.readPermissions)?.length
          ? defaultViewHandler
          : (val.canView ?? Permissions.ALWAYS),
  };
}
