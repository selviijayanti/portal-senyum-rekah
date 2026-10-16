// Helper format tanggal lokal (WIB/WITA) untuk mencegah bug zona waktu UTC pada tengah malam
export function getLocalDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return "-";
  try {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}
