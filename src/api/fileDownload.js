export const downloadBlob = (data, fileName, mimeType) => {
  const formattedFilename = fileName.trim();
  const blob = new Blob([...data], {
    type: mimeType,
  });
  const url = window.URL.createObjectURL(blob);
  downloadURL(url, formattedFilename);
  setTimeout(function () {
    return window.URL.revokeObjectURL(url);
  }, 1000);
};
const downloadURL = function (data, fileName) {
  let a;
  a = document.createElement("a");
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style = "display: none";
  a.click();
  a.remove();
};
export const downloadObjectAsJSON = (object, fileName) => {
  const blob = new Blob([JSON.stringify(object)]);
  const url = URL.createObjectURL(blob);
  downloadURL(url, `${fileName}.json`);
};


/**
 * Build a CSV from rows and trigger a download.
 *   columns: [{ key, label, map? }]  map(row) overrides row[key]
 */
export const downloadCSV = (rows, columns, fileName) => {
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const lines = (rows || []).map((r) =>
    columns.map((c) => esc(c.map ? c.map(r) : r[c.key])).join(",")
  );
  const csv = "\uFEFF" + [header, ...lines].join("\n"); // BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName.trim();
  document.body.appendChild(a); a.style.display = "none"; a.click(); a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};
