import { EnhancementRecord, AppSettings } from "./types";

const KEYS = {
  history: "pe_history",
  settings: "pe_settings",
} as const;

const defaultSettings: AppSettings = {
  theme: "system",
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getHistory(): EnhancementRecord[] {
  return get(KEYS.history, []);
}

export function saveRecord(record: EnhancementRecord) {
  const history = getHistory();
  history.unshift(record);
  // Keep max 200 records
  if (history.length > 200) history.length = 200;
  set(KEYS.history, history);
}

export function updateRecord(record: EnhancementRecord) {
  const history = getHistory();
  const idx = history.findIndex((r) => r.id === record.id);
  if (idx >= 0) history[idx] = record;
  set(KEYS.history, history);
}

export function deleteRecord(id: string) {
  set(KEYS.history, getHistory().filter((r) => r.id !== id));
}

export function clearHistory() {
  set(KEYS.history, []);
}

export function getSettings(): AppSettings {
  return get(KEYS.settings, defaultSettings);
}

export function saveSettings(settings: AppSettings) {
  set(KEYS.settings, settings);
}

export function exportData() {
  return JSON.stringify({ history: getHistory(), settings: getSettings() }, null, 2);
}

export function importData(json: string) {
  const data = JSON.parse(json);
  if (data.history) set(KEYS.history, data.history);
  if (data.settings) set(KEYS.settings, data.settings);
}
