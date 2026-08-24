import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getExcelDocuments,
  createExcelDocument,
  deleteExcelDocument,
  getExcelDocument,
} from "../../services/api";

export default function ExcelArchiveDashboard() {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDocuments = async () => {
    try {
      const docs = await getExcelDocuments();
      setDocuments(docs);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load archived documents from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target.result;
        // Parse with XLSX to generate visual grid for see-only viewer
        const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
        const sheets = wb.SheetNames.map((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
          const data = [];
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const row = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
              const cell = ws[cellRef];
              row.push(cell ? String(cell.v !== undefined ? cell.v : "") : "");
            }
            data.push(row);
          }
          return { name: sheetName, data };
        });

        // Convert the complete binary file to a base64 string
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );

        const docName = file.name.replace(/\.[^/.]+$/, "");
        const content = {
          sheets,
          fileData: base64,
        };

        await createExcelDocument({ name: docName, content });
        await loadDocuments();
      } catch (err) {
        console.error(err);
        setError(
          "Error importing Excel file. Please ensure it is a valid xlsx/xls format.",
        );
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setError("Error reading the uploaded file.");
      setIsUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this document from the archive?",
      )
    )
      return;

    try {
      await deleteExcelDocument(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error(err);
      setError("Error deleting document from database.");
    }
  };

  const handleDownload = async (docId, name) => {
    try {
      const fullDoc = await getExcelDocument(docId);
      let fileData = null;
      let sheets = [];

      if (
        fullDoc.content &&
        typeof fullDoc.content === "object" &&
        !Array.isArray(fullDoc.content)
      ) {
        fileData = fullDoc.content.fileData;
        sheets = fullDoc.content.sheets || [];
      } else if (Array.isArray(fullDoc.content)) {
        sheets = fullDoc.content;
      }

      if (fileData) {
        // Decode base64 to binary and trigger original file download
        const binaryString = atob(fileData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name || "spreadsheet"}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback reconstruction for legacy files
        const wb = XLSX.utils.book_new();
        sheets.forEach((sheet) => {
          const ws = XLSX.utils.aoa_to_sheet(sheet.data);
          XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });
        XLSX.writeFile(wb, `${name || "spreadsheet"}.xlsx`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to export Excel document.");
    }
  };

  const filteredDocs = documents.filter((doc) =>
    (doc.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight font-heading">
            Excel Document Archive
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Centrally manage and store legacy worksheets and reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="excel-import"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2 text-sm font-bold text-orange-700 shadow-sm transition-all hover:bg-orange-100 hover:shadow-md"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{isUploading ? "Importing..." : "Attach Excel file"}</span>
            <input
              type="file"
              id="excel-import"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-fadeIn">
          {error}
        </div>
      )}

      {/* Database Listing Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search documents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:border-green-600 focus:outline-none"
            />
          </div>
          <div className="text-xs text-gray-400 font-semibold font-heading">
            Total files: {filteredDocs.length}
          </div>
        </div>

        {/* Dynamic List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            <span className="text-sm text-gray-500 font-bold">
              Retrieving archive modules...
            </span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <FileSpreadsheet className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-lg font-black text-gray-800 font-heading">
              No archived files found
            </p>
            <p className="mt-1 text-sm text-gray-400 max-w-sm">
              Upload an Excel workbook or create a blank spreadsheet to get
              started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[10px] text-gray-500 font-black uppercase tracking-wider">
                <tr>
                  <th className="p-4 text-left">Document Name</th>
                  <th className="p-4 text-left hidden md:table-cell">
                    Import Details
                  </th>
                  <th className="p-4 text-left hidden sm:table-cell">
                    Last Updated
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 shadow-sm border border-green-100">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            ID: #{doc.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {new Date(doc.uploaded_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Layers className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {new Date(doc.updated_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/excel-archive/edit/${doc.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:text-green-600 hover:border-green-200 shadow-sm"
                          title="View sheet content"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDownload(doc.id, doc.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:text-blue-600 hover:border-blue-200 shadow-sm"
                          title="Export back to Excel (.xlsx)"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:text-red-650 hover:border-red-200 shadow-sm"
                          title="Delete from database"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
