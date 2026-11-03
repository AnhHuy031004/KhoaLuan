import { createApiClient } from "./client";
import { createMockFetch } from "../../mock/api";
export const IS_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/backend";
// Keep real and mock sessions separate when switching modes.
const storage = IS_MOCK ? {
  getItem: key => window.sessionStorage.getItem("mock:" + key),
  setItem: (key, value) => window.sessionStorage.setItem("mock:" + key, value),
  removeItem: key => window.sessionStorage.removeItem("mock:" + key),
} : window.sessionStorage;
export const api = createApiClient({
  baseUrl: API_BASE,
  storage,
  ...(IS_MOCK ? { fetchImpl: createMockFetch({ storage: window.localStorage }) } : {}),
  onExpired: () => window.dispatchEvent(new Event("vovinam:expired")),
});
