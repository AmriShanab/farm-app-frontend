import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Trash,
  Check,
} from "lucide-react";
import { getExcelDocument, updateExcelDocument } from "../../services/api";

const getColLabel = (colIdx) => {
  let label = "";
  let temp = colIdx;
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
};

export default function ExcelSheetEditor() {
  const { id } = useParams();

  const [documentName, setDocumentName] = useState("");
  const [sheets, setSheets] = useState([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoc = async () => {
      setIsLoading(true);
      try {
        const doc = await getExcelDocument(id);
        setDocumentName(doc.name);
        setSheets(doc.content || []);
        setActiveSheetIdx(0);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Error loading Excel document worksheets from database.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const activeSheet = sheets[activeSheetIdx] || null;
  const gridData = activeSheet ? activeSheet.data : [];

  const handleCellChange = (rowIdx, colIdx, value) => {
    const nextSheets = [...sheets];
    nextSheets[activeSheetIdx].data[rowIdx][colIdx] = value;
    setSheets(nextSheets);
  };

  const handleAddRow = () => {
    if (!activeSheet) return;
    const nextSheets = [...sheets];
    const colCount = activeSheet.data[0] ? activeSheet.data[0].length : 3;
    const newRow = Array(colCount).fill("");
    nextSheets[activeSheetIdx].data.push(newRow);
    setSheets(nextSheets);
  };

  const handleDeleteRow = () => {
    if (!activeSheet || gridData.length <= 1) return;
    const nextSheets = [...sheets];
    nextSheets[activeSheetIdx].data.pop();
    setSheets(nextSheets);
  };

  const handleAddColumn = () => {
    if (!activeSheet) return;
    const nextSheets = [...sheets];
    nextSheets[activeSheetIdx].data = activeSheet.data.map((row) => [
      ...row,
      "",
    ]);
    setSheets(nextSheets);
  };

  const handleDeleteColumn = () => {
    if (!activeSheet || (gridData[0] && gridData[0].length <= 1)) return;
    const nextSheets = [...sheets];
    nextSheets[activeSheetIdx].data = activeSheet.data.map((row) => {
      const rowCopy = [...row];
      rowCopy.pop();
      return rowCopy;
    });
    setSheets(nextSheets);
  };

  const handleAddSheet = () => {
    const newSheet = {
      name: `Sheet${sheets.length + 1}`,
      data: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ],
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetIdx(sheets.length);
  };

  const handleDeleteSheet = () => {
    if (sheets.length <= 1) return;
    const filteredSheets = sheets.filter((_, idx) => idx !== activeSheetIdx);
    setSheets(filteredSheets);
    setActiveSheetIdx(0);
  };

  const handleRenameSheet = (index, newName) => {
    if (!newName.trim()) return;
    const nextSheets = [...sheets];
    nextSheets[index].name = newName.trim();
    setSheets(nextSheets);
  };

  const handleSave = async () => {
    if (!documentName.trim()) {
      setError("Document name cannot be blank.");
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      await updateExcelDocument(id, {
        name: documentName.trim(),
        content: sheets,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to persist spreadsheet updates.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-green-605 animate-spin" />
        <span className="text-sm font-bold text-gray-500">
          Loading spreadsheet data...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Editor Header Panel */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Link
            to="/excel-archive"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-250 bg-white text-gray-500 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="text-xl font-black text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-green-600 focus:outline-none bg-transparent font-heading px-1"
              placeholder="Document Title"
            />
            <p className="text-xs text-gray-405 font-bold mt-0.5">
              Editing file ID: #{id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-green-650 font-bold border border-green-200 bg-green-50 px-3 py-1.5 rounded-xl animate-fadeIn">
              <Check className="h-3.5 w-3.5" />
              <span>Saved successfully</span>
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Sheet Action Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-150 bg-gray-50/50 p-4">
        {/* Table Rows & Columns Modifiers */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:border-green-300 hover:text-green-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Row</span>
          </button>
          <button
            onClick={handleDeleteRow}
            disabled={gridData.length <= 1}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:border-red-300 hover:text-red-650 transition-colors disabled:opacity-40"
          >
            <Trash className="h-3.5 w-3.5" />
            <span>Delete Row</span>
          </button>

          <div className="h-6 w-px bg-gray-250"></div>

          <button
            onClick={handleAddColumn}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:border-green-300 hover:text-green-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Column</span>
          </button>
          <button
            onClick={handleDeleteColumn}
            disabled={gridData[0] && gridData[0].length <= 1}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:border-red-300 hover:text-red-650 transition-colors disabled:opacity-40"
          >
            <Trash className="h-3.5 w-3.5" />
            <span>Delete Column</span>
          </button>
        </div>

        {/* Tab worksheets controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddSheet}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-green-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Sheet</span>
          </button>
          <button
            onClick={handleDeleteSheet}
            disabled={sheets.length <= 1}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-red-650 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Tab</span>
          </button>
        </div>
      </div>

      {/* GRID DATA WRAPPER */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Table Viewport */}
        <div className="max-h-[580px] overflow-auto">
          <table className="w-full table-fixed min-w-[780px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 select-none">
                {/* Upper Left Grid Pivot */}
                <th className="w-12 border-r border-gray-200 p-2 text-center text-[10px] font-black text-gray-400 bg-gray-50 sticky top-0 left-0 z-20">
                  #
                </th>
                {gridData[0]?.map((_, colIdx) => (
                  <th
                    key={colIdx}
                    className="border-r border-gray-200 p-2 text-center text-[11px] font-black text-gray-500 bg-gray-50 sticky top-0 z-10"
                  >
                    {getColLabel(colIdx)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-gray-55/35 transition-colors border-b border-gray-150"
                >
                  {/* Left row index labels */}
                  <td className="border-r border-gray-200 bg-gray-50/50 p-2 text-center text-[10px] font-bold text-gray-400 sticky left-0 z-10 select-none">
                    {rowIdx + 1}
                  </td>
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className="border-r border-gray-150 p-0 vertical-align-middle"
                    >
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) =>
                          handleCellChange(rowIdx, colIdx, e.target.value)
                        }
                        className="w-full bg-transparent border-0 px-3 py-2 text-sm text-gray-800 focus:bg-green-50/50 focus:ring-1 focus:ring-green-600 focus:outline-none transition-colors"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Worksheets tabs navigation bar */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {sheets.map((sheet, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeSheetIdx === index
                  ? "bg-white border-gray-250 text-green-700 shadow-sm"
                  : "bg-transparent border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <button
                onClick={() => setActiveSheetIdx(index)}
                className="focus:outline-none"
              >
                {sheet.name}
              </button>

              <input
                type="text"
                value={sheet.name}
                aria-label={`Rename ${sheet.name}`}
                onChange={(e) => handleRenameSheet(index, e.target.value)}
                className="hidden focus:block max-w-[80px] bg-transparent border-b border-gray-300 text-xs py-0.5 outline-none px-1 text-center font-bold"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
