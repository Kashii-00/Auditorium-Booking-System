import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { authRequest } from "../../services/authService"
import { getApiUrl } from '../../utils/apiUrl';
import "./styles/styles.css";
import { useLocation } from "react-router-dom";
import Select from "react-select"; // make sure this is imported

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

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "transparent",
    borderColor: state.isFocused ? "#01eeff" : "#00a6ff9d",
    borderWidth: 3,
    borderRadius: 4,
    minHeight: 32,
    boxShadow: "none",
    fontSize: "12px",
    "&:hover": { borderColor: "#01eeff" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 6px", fontSize: "12px" }),
  placeholder: (base) => ({ ...base, color: "#999", fontSize: "12px" }),
  input: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
  singleValue: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#003b5a",
    color: "#e3eaf5",
    fontSize: "10px",
    borderRadius: 4,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#01eeff" : "transparent",
    color: state.isFocused ? "#000" : "#e3eaf5",
    fontSize: "12px",
    padding: "6px 10px",
  }),
};

const EditRatesPanel = () => {
  const DRAFT_NEW_RATE_KEY = "draftNewRateForm";
  const DRAFT_SEARCH_TERM_KEY = "draftRatesDBSearchTerm";

  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  // const [searchTerm, setSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(DRAFT_SEARCH_TERM_KEY) || "";
  });

  const [showAddModal, setShowAddModal] = useState(false);
  // const [newRate, setNewRate] = useState({
  //   item_description: "",
  //   category: "",
  //   rate: "",
  //   rate_type: "Quantity",
  //   cost_type: "C",
  // });
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

  const [currentPage, setCurrentPage] = useState(1); // 🔁
  const itemsPerPage = 10; // 🔁
  const totalPages = Math.ceil(filteredRates.length / itemsPerPage); // 🔁

  const [rateToDelete, setRateToDelete] = useState(null);

  // 🔁 Get paginated rows
  const paginatedRates = filteredRates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const successTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(DRAFT_NEW_RATE_KEY, JSON.stringify(newRate));
  }, [newRate]);

  useEffect(() => {
    localStorage.setItem(DRAFT_SEARCH_TERM_KEY, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setError("");
      }, 5000);
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

    const rows = filteredRates.map((rate) => [
      rate.item_description,
      rate.category,
      rate.rate,
      rate.rate_type,
      rate.cost_type,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rates_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState");
      if (stored !== null) {
        const isCollapsed = stored === "true";
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: { isCollapsed },
          })
        );
      }
    };

    syncSidebarState();
    window.addEventListener("popstate", syncSidebarState);

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      localStorage.setItem("sidebarState", e.detail.isCollapsed);
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    window.addEventListener("sidebarHover", handleSidebarHover);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("popstate", syncSidebarState);
    };
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   handleSearch(searchTerm);
  // }, [rates]);

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
      const response = await authRequest(
        "get",
        getApiUrl("/rates")
      );
      setRates(response);
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    }
  };

  // const handleSearch = (term) => {
  //   const lower = term.toLowerCase();
  //   const filtered = rates.filter(
  //     (r) =>
  //       r.item_description.toLowerCase().includes(lower) ||
  //       r.category?.toLowerCase().includes(lower)
  //   );
  //   setFilteredRates(filtered);
  // };

  const handleEdit = (rate) => {
    setEditingRateId(rate.id);
    setEditingRateValue(rate.rate);
  };

  const handleUpdateRate = async (rate) => {
    const value = parseFloat(editingRateValue);
    if (isNaN(value) || value < 0) {
      setError(`Rate must be a non-negative number.`);
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
      setSuccessMessage(`Rate updated successfully!`);
      setEditingRateId(null);
      fetchRates();
    } catch (err) {
      setError(`Rates updated Unsuccessful!`);
      console.error("Failed to update rate:", err);
    }
  };

  const confirmDelete = async (rate) => {
    try {
      await authRequest(
        "delete",
        getApiUrl(`/rates/by-item?itemDescription=${encodeURIComponent(
          rate.item_description
        )}&category=${encodeURIComponent(rate.category)}`)
      );
      setRateToDelete(null);
      fetchRates();
    } catch (err) {
      console.error("Failed to delete rate:", err);
    }
  };

  const handleAddRate = async () => {
    const rateValue = parseFloat(newRate.rate);
    if (isNaN(rateValue) || rateValue < 0) {
      setError(`Rate must be a non-negative number.`);
      return;
    }
    try {
              await authRequest("post", getApiUrl("/rates"), {
        items: [newRate],
      });
      setSuccessMessage(`Rate added successfully!`);
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
      setError(`Failed to add new rates!`);
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
    <div
      className={`content-wrapper ${
        sidebarCollapsed ? "expanded" : ""
      } form-wp2`}
    >
      {successMessage && (
        <div className="success-popup2">✅ {successMessage}</div>
      )}
      {error && <div className="error-popup2">❌ {error}</div>}

      <div className="header-controls">
        <h2 className="panel-title">Manage Rates</h2>
        <div className="control-actions">
          <div className="search-filter-container">
            <div className="search-box sb2">
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search description or category..."
                className="input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>
            <div className="edit-rate-actions">
              <button
                className="btn btn-blue"
                onClick={() => setShowAddModal(true)}
              >
                + Add Rate
              </button>
              <button className="btn btn-green" onClick={handleExportCSV}>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="rate-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Rate</th>
              <th>Type</th>
              <th>Cost Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRates.map((rate) => (
              <tr key={rate.id}>
                <td>{rate.item_description}</td>
                <td>{rate.category}</td>
                <td>
                  {editingRateId === rate.id ? (
                    <input
                      type="number"
                      step="0.01"
                      className="input rateTable-input"
                      value={editingRateValue}
                      onChange={(e) => setEditingRateValue(e.target.value)}
                      min="0"
                    />
                  ) : (
                    rate.rate.toFixed(2)
                  )}
                </td>
                <td>{rate.rate_type}</td>
                <td>{rate.cost_type}</td>
                <td>
                  {editingRateId === rate.id ? (
                    <>
                      <button
                        className="action-save"
                        onClick={() => handleUpdateRate(rate)}
                      >
                        Save
                      </button>
                      <button
                        className="action-cancel"
                        onClick={() => setEditingRateId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-edit"
                      onClick={() => handleEdit(rate)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className="action-delete"
                    onClick={() => setRateToDelete(rate)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {paginatedRates.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-row">
                  No rates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={currentPage === i + 1 ? "active-page" : ""}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal md2">
            <h3 className="modal-title">Add New Rate</h3>
            <div className="modal-body">
              <div className="step-two-grid aid-request-form-type2">
                {/* Item Description */}
                <div className="form-step">
                  <input
                    className="input"
                    placeholder=" "
                    value={newRate.item_description}
                    onChange={(e) =>
                      setNewRate({
                        ...newRate,
                        item_description: e.target.value,
                      })
                    }
                  />
                  <label className={newRate.item_description ? "active2" : ""}>
                    Item Description
                  </label>
                </div>

                {/* Category */}
                <div className="form-step">
                  <Select
                    styles={customSelectStyles}
                    options={categoryOptions}
                    value={
                      newRate.category
                        ? { label: newRate.category, value: newRate.category }
                        : null
                    }
                    onChange={(selected) =>
                      setNewRate((prev) => ({
                        ...prev,
                        category: selected?.value || "",
                      }))
                    }
                    placeholder=" "
                    isClearable
                  />
                  <label className={newRate.category ? "active2" : ""}>
                    Category
                  </label>
                </div>

                {/* Rate */}
                <div className="form-step">
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder=" "
                    min="0"
                    value={newRate.rate}
                    onChange={(e) =>
                      setNewRate({ ...newRate, rate: e.target.value })
                    }
                  />
                  <label className={newRate.rate ? "active2" : ""}>Rate</label>
                </div>
                {/* Rate Type */}
                <div className="form-step">
                  <Select
                    styles={customSelectStyles}
                    options={rateTypeOptions}
                    value={
                      rateTypeOptions.find(
                        (opt) => opt.value === newRate.rate_type
                      ) || null
                    }
                    onChange={(selected) =>
                      setNewRate((prev) => ({
                        ...prev,
                        rate_type: selected?.value || "",
                      }))
                    }
                    placeholder=" "
                    isClearable
                  />
                  <label className={newRate.rate_type ? "active2" : ""}>
                    Rate Type
                  </label>
                </div>

                {/* Cost Type */}
                <div className="form-step">
                  <Select
                    styles={customSelectStyles}
                    options={costTypeOptions}
                    value={
                      costTypeOptions.find(
                        (opt) => opt.value === newRate.cost_type
                      ) || null
                    }
                    onChange={(selected) =>
                      setNewRate((prev) => ({
                        ...prev,
                        cost_type: selected?.value || "",
                      }))
                    }
                    placeholder=" "
                    isClearable
                  />
                  <label className={newRate.cost_type ? "active2" : ""}>
                    Cost Type
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-gray"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-red" onClick={clearNewRateForm}>
                Clear
              </button>
              <button className="btn btn-blue" onClick={handleAddRate}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      {rateToDelete && (
        <div className="modal-overlay">
          <div className="modal md2">
            <h3 className="modal-title">Confirm Delete</h3>
            <div className="modal-body">
              Are you sure you want to delete this rate?
              <br />
              <strong>{rateToDelete.item_description}</strong> in{" "}
              <strong>{rateToDelete.category}</strong>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-gray"
                onClick={() => setRateToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-red"
                onClick={() => confirmDelete(rateToDelete)}
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
