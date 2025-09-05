import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { authRequest } from "../../services/authService";
import { useLocation } from "react-router-dom";
import { getApiUrl } from "../../utils/apiUrl";

const rateTypeOptions = [
  { value: "Quantity", label: "Per Unit Rate" },
  { value: "Hourly", label: "Hourly Rate" },
  { value: "Quantity_Hourly", label: "Unit Hourly Rate" },
  { value: "Full Payment", label: "Paid In Full" },
];

const costTypeOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
];

const EditRatesPanel = () => {
  const DRAFT_NEW_RATE_KEY = "draftNewRateForm";
  const DRAFT_SEARCH_TERM_KEY = "draftRatesDBSearchTerm";

  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [searchTerm, setSearchTerm] = useState(
    () => localStorage.getItem(DRAFT_SEARCH_TERM_KEY) || ""
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRate, setNewRate] = useState(() => {
    const saved = localStorage.getItem(DRAFT_NEW_RATE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          item_description: "",
          category: "",
          rate: "",
          rate_type: "Quantity",
          cost_type: "C",
        };
  });

  const [editingRateId, setEditingRateId] = useState(null);
  const [editingRateValue, setEditingRateValue] = useState("");

  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRates.length / itemsPerPage);

  const [rateToDelete, setRateToDelete] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const successTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const paginatedRates = filteredRates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  useEffect(() => {
    localStorage.setItem(DRAFT_NEW_RATE_KEY, JSON.stringify(newRate));
  }, [newRate]);

  useEffect(() => {
    localStorage.setItem(DRAFT_SEARCH_TERM_KEY, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
    }
  }, [error]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(
      new Set(rates.map((r) => r.category).filter(Boolean))
    );
    return unique.map((cat) => ({ label: cat, value: cat }));
  }, [rates]);

  const handleExportCSV = () => {
    if (!filteredRates.length) return;
    const headers = [
      "Item Description",
      "Category",
      "Rate",
      "Rate Type",
      "Cost Type",
    ];
    const rows = filteredRates.map((r) => [
      r.item_description,
      r.category,
      r.rate,
      r.rate_type,
      r.cost_type,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rates_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = useCallback(
    (term) => {
      const lower = term.toLowerCase();
      const filtered = rates.filter(
        (r) =>
          r.item_description.toLowerCase().includes(lower) ||
          r.category?.toLowerCase().includes(lower)
      );
      setFilteredRates(filtered);
    },
    [rates]
  );

  useEffect(() => {
    handleSearch(searchTerm);
  }, [rates, handleSearch, searchTerm]);

  const fetchRates = async () => {
    try {
      const response = await authRequest("get", getApiUrl("/rates"));
      setRates(response);
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    }
  };

  const handleEdit = (rate) => {
    setEditingRateId(rate.id);
    setEditingRateValue(rate.rate);
  };

  const handleUpdateRate = async (rate) => {
    const value = parseFloat(editingRateValue);
    if (isNaN(value) || value < 0) {
      setError("Rate must be a non-negative number.");
      return;
    }
    try {
      await authRequest("patch", getApiUrl("/rates"), {
        items: [
          {
            item_description: rate.item_description,
            category: rate.category,
            rate: parseFloat(editingRateValue),
          },
        ],
      });
      setSuccessMessage("Rate updated successfully!");
      setEditingRateId(null);
      setEditingRateValue("");
      fetchRates();
    } catch {
      setError("Rates update failed.");
      console.error("Failed to update rate:", err);
    }
  };

  const confirmDelete = async (rate) => {
    try {
      await authRequest(
        "delete",
        getApiUrl(
          `/rates/by-item?itemDescription=${encodeURIComponent(
            rate.item_description
          )}&category=${encodeURIComponent(rate.category)}`
        )
      );
      setRateToDelete(null);
      fetchRates();
    } catch (err) {
      setError("Failed to delete rate.");
      console.error("Failed to delete rate:", err);
    }
  };

  const handleAddRate = async () => {
    const value = parseFloat(newRate.rate);
    if (isNaN(value) || value < 0) {
      setError("Rate must be a non-negative number.");
      return;
    }
    try {
      await authRequest("post", getApiUrl("/rates"), { items: [newRate] });
      setSuccessMessage("Rate added successfully!");
      setShowAddModal(false);
      localStorage.removeItem(DRAFT_NEW_RATE_KEY);
      setNewRate({
        item_description: "",
        category: "",
        rate: "",
        rate_type: "Quantity",
        cost_type: "C",
      });
      fetchRates();
    } catch (err) {
      setError("Failed to add new rate.");
      console.error("Failed to add new rate:", err);
    }
  };

  const clearNewRateForm = () => {
    setNewRate({
      item_description: "",
      category: "",
      rate: "",
      rate_type: "Quantity",
      cost_type: "C",
    });
    localStorage.removeItem(DRAFT_NEW_RATE_KEY);
    setSuccessMessage("Rate form cleared.");
  };

  return (
    <div className="p-6 ml-8 transition-all">
      {/* Success & Error */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-100 text-green-800 px-4 py-2">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 text-red-800 px-4 py-2">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Rates</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="border rounded-md px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + Add Rate
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full text-sm text-left border border-gray-200">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Cost Type</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRates.map((rate) => (
              <tr key={rate.id} className="border-t">
                <td className="px-4 py-2">{rate.item_description}</td>
                <td className="px-4 py-2">{rate.category}</td>
                <td className="px-4 py-2">
                  {editingRateId === rate.id ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="border rounded px-2 py-1 w-24"
                      value={editingRateValue}
                      onChange={(e) => setEditingRateValue(e.target.value)}
                    />
                  ) : (
                    rate.rate.toFixed(2)
                  )}
                </td>
                <td className="px-4 py-2">{rate.rate_type}</td>
                <td className="px-4 py-2">{rate.cost_type}</td>
                <td className="px-4 py-2 flex gap-2">
                  {editingRateId === rate.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateRate(rate)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingRateId(null);
                          setEditingRateValue("");
                        }}
                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(rate)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => setRateToDelete(rate)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {paginatedRates.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  No rates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          {renderPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-2">
                ...
              </span>
            ) : (
              <button
                key={i}
                onClick={() => handlePageChange(p)}
                className={`px-3 py-1 rounded ${
                  p === currentPage ? "bg-blue-600 text-white" : "border"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Rate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Add New Rate</h3>
            <div className="space-y-3">
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="Item Description"
                value={newRate.item_description}
                onChange={(e) =>
                  setNewRate({ ...newRate, item_description: e.target.value })
                }
              />
              <select
                className="border rounded px-3 py-2 w-full"
                value={newRate.category}
                onChange={(e) =>
                  setNewRate({ ...newRate, category: e.target.value })
                }
              >
                <option value="">Select Category</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                className="border rounded px-3 py-2 w-full"
                placeholder="Rate"
                value={newRate.rate}
                onChange={(e) =>
                  setNewRate({ ...newRate, rate: e.target.value })
                }
              />
              <select
                className="border rounded px-3 py-2 w-full"
                value={newRate.rate_type}
                onChange={(e) =>
                  setNewRate({ ...newRate, rate_type: e.target.value })
                }
              >
                {rateTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-3 py-2 w-full"
                value={newRate.cost_type}
                onChange={(e) =>
                  setNewRate({ ...newRate, cost_type: e.target.value })
                }
              >
                {costTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={clearNewRateForm}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Clear
              </button>
              <button
                onClick={handleAddRate}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {rateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <strong>{rateToDelete.item_description}</strong> in{" "}
              <strong>{rateToDelete.category}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRateToDelete(null)}
                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(rateToDelete)}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRatesPanel;
