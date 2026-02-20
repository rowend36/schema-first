# @schema-first/core

A strictly typed, framework-agnostic data specification engine. Define your domain logic, permissions, and API actions once; render them anywhere.

## 🎯 Goals

- **Single Source of Truth**: Define labels, validation, and API logic in the "Spec," not the UI.
- **Strict Framework Interop**: Use the `TypeRegistry` to swap React components for Vue/Svelte nodes without losing type safety.
- **Convention over Configuration**: Automatically infer labels and URLs while allowing deep overrides.
- **Zero UI Dependency**: The core package manages the _logic_ of data; your UI package manages the _pixels_.

---

## ⚙️ Configuration & Customization

### 1. The Type Registry (Framework Interop)

If you are using something other than React, or want to lock down your API paths, use **Declaration Merging** in a `spec.d.ts` file:

```typescript
import "@schema-first/core";

declare module "@schema-first/core" {
  interface TypeRegistry {
    element: MyVueVNode; // Swap ReactNode
    icon: MyIconComponent;
    resource_key: "User" | "Project" | "Invoice"; // Strict keys
  }

  interface ColumnMetadataRegistry {
    isInternal: boolean; // Add custom column props
  }
}
```

### 2. Initializing Conventions

Initialize the engine at your app's entry point to inject icons and fetch logic.

```typescript
import {
  initializeConventions,
  labels,
  urls,
  auto_pages,
} from "@schema-first/core";
import { FiPlus, FiTrash } from "react-icons/fi";

initializeConventions({
  UNIMPLEMENTED_PLACEHOLDER: <i>Not yet implemented</i>,
  actions: {
    create: { label: "Add {resource}", icon: FiPlus },
    delete: { label: "Remove", icon: FiTrash, color: "red" },
  },
  fetch: async (url, method, body) => {
    const res = await fetch(url, { method, body: JSON.stringify(body) });
    return res.json();
  },
  labels,
  urls,
  auto_pages,
  loadSpec: (name) => myCachedSpecs[name],
  SORTABLE_FIELDS: ["string", "number", "datetime"],
});
```

---

## 🎨 The Renderer System

The `RegisteredRenderer` system is the bridge between your **Spec** and your **UI Library**. It allows you to register components for specific data types and view modes (Table, Form, etc.).

### Registering a Custom Renderer

If you have a custom "Markdown" type or want to override how "Currency" looks in a table:

```typescript
import { registerRenderer } from "@schema-first/core";

// Register a custom table renderer for currency
registerRenderer("number", {
  view: "table",
  test: (spec) => spec.numberType === "currency",
  renderer: ({ data, meta }) => (
    <span className="font-mono">
      {meta.currency} {data.toLocaleString()}
    </span>
  ),
});
```

### Consuming Renderers in UI

In your components, use `getRenderer` to resolve the correct component based on the spec.

```tsx
const ColumnCell = ({ spec, data }) => {
  // Finds the best match in the Registry (or returns the Placeholder)
  const Renderer = getRenderer(spec, "table");

  return <Renderer data={data} spec={spec} meta={spec.meta} />;
};
```

---

## 📊 Using in Tables

The Spec provides everything needed to build high-performance data tables. Use `tableColumns` to iterate through keys.

```tsx
const { tableColumns, columns } = UserSpec;

return (
  <table>
    <thead>
      <tr>
        {tableColumns.map((key) => (
          <th key={key}>{columns[key].label}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id}>
          {tableColumns.map((key) => (
            <td key={key}>
              <ColumnCell spec={columns[key]} data={row[key]} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
```

---

## 📝 Using in Forms

The `RawColumnSpec` handles validation and field types. Use the `form` property on Actions to render dynamic modals or pages.

```typescript
const CreateUserAction = new APIAction({
  method: "POST",
  form: UserSpec, // The form is driven by the UserSpec columns
  label: "Create User",
  execute: async (data) => {
    /* ... */
  },
});

// In your Form Component:
{
  Object.entries(UserSpec.columns).map(([key, col]) => {
    if (!col.showOnForm) return null;
    const Input = getRenderer(col, "form");
    return <Input key={key} spec={col} />;
  });
}
```

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.
