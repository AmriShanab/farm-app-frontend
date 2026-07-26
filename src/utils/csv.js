const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const cellText = (cell) =>
  cell?.innerText
    ?.replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '';

const isVisible = (element) =>
  element && element.getClientRects().length > 0;

const headingBeforeTable = (table, container) => {
  const headings = Array.from(
    container.querySelectorAll('h2, h3, h4, [data-csv-title]')
  ).filter(
    (heading) =>
      isVisible(heading) &&
      Boolean(heading.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING)
  );

  return cellText(headings.at(-1));
};

/**
 * Exports the visible data tables inside a page container.
 * UI-only columns are omitted and multiple tables are separated into clearly
 * labelled report sections.
 */
export const downloadTablesCsv = (filename, container) => {
  const tables = Array.from(container?.querySelectorAll('table') || []).filter(isVisible);
  if (!tables.length) return false;

  const pageTitle = cellText(container.querySelector('h1')) || 'Farm Data Report';
  const exportedAt = new Date().toLocaleString('en-GB');
  const sections = [
    escapeCsvValue(`MR Farm - ${pageTitle}`),
    `${escapeCsvValue('Exported')},${escapeCsvValue(exportedAt)}`,
    '',
  ];

  tables.forEach((table, tableIndex) => {
    const rows = Array.from(table.querySelectorAll('tr')).filter(isVisible);
    if (!rows.length) return;

    const headerCells = Array.from(rows[0].querySelectorAll('th, td'));
    const excludedColumns = new Set(
      headerCells.flatMap((cell, index) =>
        /^(actions?|manage|options?)$/i.test(cellText(cell)) ? [index] : []
      )
    );

    headerCells.forEach((_, index) => {
      const dataCells = rows
        .slice(1)
        .map((row) => Array.from(row.querySelectorAll(':scope > th, :scope > td'))[index])
        .filter(Boolean);
      if (
        dataCells.length &&
        dataCells.every((cell) => cell.querySelector('button, [role="button"]'))
      ) {
        excludedColumns.add(index);
      }
    });

    const csvRows = rows
      .map((row) =>
        Array.from(row.querySelectorAll(':scope > th, :scope > td'))
          .filter((cell, index) => !excludedColumns.has(index) && isVisible(cell))
          .map((cell) => escapeCsvValue(cellText(cell)))
          .join(',')
      )
      .filter(Boolean);

    if (!csvRows.length) return;
    const sectionTitle =
      table.querySelector('caption')?.innerText?.trim() ||
      headingBeforeTable(table, container) ||
      (tables.length === 1 ? pageTitle : `Table ${tableIndex + 1}`);

    sections.push(escapeCsvValue(sectionTitle));
    sections.push(...csvRows, '');
  });

  const blob = new Blob([`\uFEFF${sections.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
};
