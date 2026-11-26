import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import assert from 'node:assert/strict';
const contract = JSON.parse(
  readFileSync(
    new URL('../../contracts/openapi.json', import.meta.url),
    'utf8',
  ),
);
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const cache = new Map();
export function validateContract(path, method, envelope) {
  const normalized = contract.paths[path]
    ? path
    : Object.keys(contract.paths).find(
        (candidate) =>
          new RegExp('^' + candidate.replace(/\{[^}]+\}/g, '[^/]+') + '$').test(
            path,
          ) && contract.paths[candidate][method.toLowerCase()],
      );
  path = normalized || path;
  const key = method + ' ' + path;
  let validate = cache.get(key);
  if (!validate) {
    const schema =
      contract.paths[path]?.[method.toLowerCase()]?.responses['200'].content[
        'application/json'
      ].schema;
    assert(schema, 'Missing contract ' + key);
    validate = ajv.compile({ ...schema, components: contract.components });
    cache.set(key, validate);
  }
  assert(validate(envelope), key + ' ' + JSON.stringify(validate.errors));
}
export function validateSchema(name, value) {
  const validate = ajv.compile({
    $ref: '#/components/schemas/' + name,
    components: contract.components,
  });
  assert(validate(value), name + ' ' + JSON.stringify(validate.errors));
}
