import assert from 'node:assert/strict';
const forbidden =
  /^(password|passwordHash|accessToken|refreshToken|mfaToken|secret|totpSecret|recoveryCodes|resetTokens|sessions)$/i;
export function assertNoSecrets(value, path = 'response') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert(!forbidden.test(key), `Secret field leaked: ${path}.${key}`);
    assertNoSecrets(child, `${path}.${key}`);
  }
}
