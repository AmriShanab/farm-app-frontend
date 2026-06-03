const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const downloadCsv = (filename, columns, rows) => {
  const headerLine = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const bodyLines = (rows || []).map((row) =>
    columns.map((column) => escapeCsvValue(column.value(row))).join(',')
  );

  const csvContent = [headerLine, ...bodyLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};