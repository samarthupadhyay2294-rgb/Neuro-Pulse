const KEY = "neuro_pulse_guest_history";

export function loadGuestHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGuestPrediction(entry) {
  const list = loadGuestHistory();
  const item = {
    id: entry.id,
    created_at: new Date().toISOString(),
    symptoms_only: entry.symptoms_only,
    result: entry.result,
    symptoms: entry.symptoms,
  };
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  return item;
}
