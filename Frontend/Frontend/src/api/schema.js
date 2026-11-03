import contract from "./contract.json" with { type: "json" };
export const operations = contract.operations;
export const schemas = contract.schemas;
export function resolveSchema(schema) {
  if (!schema) return {};
  if (schema.$ref) return resolveSchema(schemas[schema.$ref.split("/").pop()]);
  if (schema.allOf)
    return schema.allOf.reduce(
      (a, s) => ({ ...a, ...resolveSchema(s), ...schema, allOf: undefined }),
      {},
    );
  return schema;
}
export function operation(key) {
  const o = operations[key];
  if (!o) throw Error("Operation not in supplied API contract: " + key);
  return o;
}
export function canUse(key, role) {
  const o = operation(key);
  return !o.roles || o.roles.includes(role);
}
export function operationPath(key, params = {}) {
  return operation(key).path.replace(/\{([^}]+)\}/g, (_, name) => {
    if (params[name] === undefined || params[name] === "")
      throw Error("Thiếu " + name);
    return encodeURIComponent(params[name]);
  });
}
export function listData(data) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data?.items)
    return {
      items: data.items,
      total: data.total ?? data.items.length,
      page: data.page,
      limit: data.limit,
    };
  if (data?.rows) return { items: data.rows, total: data.rows.length };
  return { items: data ? [data] : [], total: data ? 1 : 0 };
}
export function packBody(schema, values) {
  schema = resolveSchema(schema);
  if (schema.type === "array")
    return (values || []).map((v) => packBody(schema.items, v));
  if (schema.type === "object" || schema.properties) {
    const out = {};
    for (const [key, s] of Object.entries(schema.properties || {})) {
      const v = values?.[key];
      if (v === undefined || v === "" || v === null) continue;
      out[key] = packBody(s, v);
    }
    return out;
  }
  if (schema.type === "number" || schema.type === "integer") {
    const n = Number(values);
    if (!Number.isFinite(n)) throw Error("Số không hợp lệ.");
    return n;
  }
  if (schema.type === "boolean") return values === true || values === "true";
  if (schema.format === "date-time" && values)
    return new Date(values).toISOString();
  return values;
}
