function isIgnoredKey(key) {
  if (!key) return true;
  const k = String(key).toLowerCase().trim();
  return (
    k === "id" ||
    k === "units" ||
    k.endsWith("_id") ||
    (k.endsWith("id") && k !== "paid") ||
    k === "company_id" ||
    k === "property_id" ||
    k === "tenant_id" ||
    k === "user_id" ||
    k === "unit_id"
  );
}

/**
 * Utility function to convert an array of objects to CSV and trigger a download in the browser.
 * Includes UTF-8 BOM so Excel opens special characters and commas properly.
 * 
 * @param {Array<Object>} data - Array of objects to export.
 * @param {String} filename - Desired output filename (e.g. "properties.csv").
 * @param {Array<String|Object>} headers - Optional custom headers. E.g. [{ key: "unitCode", label: "Unit Number" }] or ["name", "email"]
 */
export function exportToCSV(data, filename = "export.csv", headers = null) {
  if (typeof window === "undefined" || !Array.isArray(data) || data.length === 0) {
    console.warn("exportToCSV: Data must be a non-empty array.");
    return;
  }

  let keys = [];
  let headerLabels = [];

  // Determine keys and header labels
  if (headers && Array.isArray(headers) && headers.length > 0) {
    headers.forEach((h) => {
      if (typeof h === "string") {
        if (!isIgnoredKey(h)) {
          keys.push(h);
          headerLabels.push(h);
        }
      } else if (typeof h === "object" && h !== null && h.key) {
        if (!isIgnoredKey(h.key)) {
          keys.push(h.key);
          headerLabels.push(h.label || h.key);
        }
      }
    });
  } else {
    // Automatically extract keys from the first object, excluding IDs and units
    keys = Object.keys(data[0]).filter((key) => !isIgnoredKey(key));
    headerLabels = keys.map((key) =>
      key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
    );
  }

  // Format and escape CSV cells
  const formatCell = (val) => {
    if (val === null || val === undefined) return '""';
    if (typeof val === "object") {
      val = JSON.stringify(val);
    }
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvRows = [];

  // Header row
  csvRows.push(headerLabels.map(formatCell).join(","));

  // Data rows
  data.forEach((row) => {
    const rowValues = keys.map((key) => {
      // Support nested key paths like "property.name"
      if (key.includes(".")) {
        const parts = key.split(".");
        let curr = row;
        for (const p of parts) {
          curr = curr ? curr[p] : undefined;
        }
        return formatCell(curr);
      }
      return formatCell(row[key]);
    });
    csvRows.push(rowValues.join(","));
  });

  // UTF-8 BOM byte marker so Microsoft Excel renders non-ASCII characters and commas correctly
  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  const name = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", name);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reusable React Button Component to trigger CSV Export.
 */
export default function ExportCSVButton({
  data = [],
  filename = "export.csv",
  headers = null,
  label = "Export CSV",
  className = "",
  disabled = false,
}) {
  const handleExport = () => {
    exportToCSV(data, filename, headers);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
      }
    >
      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </button>
  );
}
