export function toWriteDto(config, values, { update = false } = {}) {
  const result = {};
  for (const field of config.fields) {
    if (!Object.hasOwn(values, field.key)) continue;
    let value = values[field.key];
    if (update && field.type === 'password' && !value) continue;
    if (
      ['money', 'number', 'score', 'percent'].includes(field.type) &&
      value !== '' &&
      value !== null
    ) {
      value = Number(value);
      if (!Number.isFinite(value)) throw Error(field.label + ' không hợp lệ.');
    }
    if (field.type === 'items' && Array.isArray(value))
      value = value.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitAmount: Number(item.unitAmount),
      }));
    result[field.key] = value;
  }
  if (config.id === 'invoices' && values.priceOverrideReason !== undefined)
    result.priceOverrideReason = String(values.priceOverrideReason).trim();
  if (config.id === 'users' && values.role) {
    if (values.role !== 'MASTER')
      for (const key of ['masterLevel', 'wardId', 'clubId']) delete result[key];
    else if (values.masterLevel === 'PROVINCE') {
      delete result.wardId;
      delete result.clubId;
    } else if (values.masterLevel === 'WARD') delete result.clubId;
  }
  return result;
}
