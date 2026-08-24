import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, FileSpreadsheet } from "lucide-react";
import { getExcelDocument } from "../../services/api";

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
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoc = async () => {
      setIsLoading(true);
      try {
        const doc = await getExcelDocument(id);
        setDocumentName(doc.name);

        let sheetsData = [];
        if (
          doc.content &&
          typeof doc.content === "object" &&
          !Array.isArray(doc.content)
        ) {
          sheetsData = doc.content.sheets || [];
        } else if (Array.isArray(doc.content)) {
          sheetsData = doc.content;
        }

        setSheets(sheetsData);
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-255 bg-white text-gray-500 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-905 font-heading px-1">
              {documentName || "Excel Document"}
            </h1>
            <p className="text-xs text-gray-405 font-bold mt-0.5">
              View File ID: #{id}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* GRID DATA WRAPPER */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Table Viewport */}
        {gridData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <FileSpreadsheet className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-lg font-black text-gray-800 font-heading">
              Empty Sheet
            </p>
            <p className="mt-1 text-sm text-gray-400">
              No grid data structure detected in this workbook tab.
            </p>
          </div>
        ) : (
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
                    className="hover:bg-gray-50/50 transition-colors border-b border-gray-150"
                  >
                    {/* Left row index labels */}
                    <td className="border-r border-gray-200 bg-gray-50/50 p-2 text-center text-[10px] font-bold text-gray-400 sticky left-0 z-10 select-none">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className="border-r border-gray-150 px-3 py-2 text-sm text-gray-800 align-middle truncate select-all"
                        title={cell}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Worksheets tabs navigation bar */}
        {sheets.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 flex items-center gap-2 overflow-x-auto">
            {sheets.map((sheet, index) => (
              <button
                key={index}
                onClick={() => setActiveSheetIdx(index)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border outline-none ${
                  activeSheetIdx === index
                    ? "bg-white border-gray-250 text-green-700 shadow-sm"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {sheet.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
