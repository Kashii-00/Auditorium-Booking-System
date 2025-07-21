import React, { useEffect, useState, useRef } from "react";
import { authRequest } from "../../services/authService";
import { useLocation, useNavigate } from "react-router-dom";
import "../Classroom_Booking/styles/ClassroomBooking.css";
import { Copy } from "lucide-react";

const PaymentsMainDetails = () => {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const filterPopupRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );

  const navigate = useNavigate();

  const infoRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);

  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    duration: "",
    CTM_approved: "",
    CTM_details: "",
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterStatus("ALL");
    setFilterMonth("ALL");
    localStorage.removeItem("paymentsMainFilters"); // ❌ clear saved filters
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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
    const savedFilters = localStorage.getItem("paymentsMainFilters");
    if (savedFilters) {
      try {
        const { searchTerm, filterStatus, filterMonth } =
          JSON.parse(savedFilters);
        if (searchTerm !== undefined) setSearchTerm(searchTerm);
        if (filterStatus !== undefined) setFilterStatus(filterStatus);
        if (filterMonth !== undefined) setFilterMonth(filterMonth);
      } catch (e) {
        console.warn("Failed to parse saved filters:", e);
      }
    }
    setFiltersLoaded(true); // ✅ ensure flag is set
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return; // ⛔ skip initial load

    const filtersToStore = {
      searchTerm,
      filterStatus,
      filterMonth,
    };
    localStorage.setItem("paymentsMainFilters", JSON.stringify(filtersToStore));
  }, [searchTerm, filterStatus, filterMonth, filtersLoaded]);

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (id) => {
    try {
      await authRequest("patch", `http://localhost:5003/api/payments/${id}`, {
        duration: editValues.duration,
        CTM_approved: editValues.CTM_approved,
        CTM_details: editValues.CTM_details,
      });
      setSuccessMessage(`Payment ${id} updated`);
      setEditingId(null);
      fetchPayments(); // Refresh list
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await authRequest(
        "get",
        "http://localhost:5003/api/payments"
      );
      setPayments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await authRequest("delete", `http://localhost:5003/api/payments/${id}`);
      setSuccessMessage(`Payment ${id} deleted`);
      fetchPayments();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.stream?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toString().includes(searchTerm);

    const matchesStatus =
      filterStatus === "ALL" ||
      p.CTM_approved?.toLowerCase() === filterStatus.toLowerCase();

    const matchesMonth =
      filterMonth === "ALL" ||
      new Date(p.date).getMonth() === parseInt(filterMonth);

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const getExportButtonText = () => {
    const parts = ["Export"];
    if (filterStatus !== "ALL") parts.push(filterStatus.toLowerCase());
    if (filterMonth !== "ALL") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      parts.push(monthNames[parseInt(filterMonth)]);
    }
    return parts.join(" ");
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Course Name",
      "Stream",
      "Customer Type",
      "Participants",
      "Duration",
      "CTM Status",
      "CTM Details",
      "Date",
    ];

    const data = filteredPayments.map((p) => [
      p.id,
      p.course_name,
      p.stream,
      p.customer_type,
      p.no_of_participants,
      p.duration,
      p.CTM_approved,
      p.CTM_details,
      formatDate(p.date),
    ]);

    const csvContent = [headers, ...data]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments_main_details.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const SuccessPopup = ({ message }) => (
    <div className="success-popup">
      <svg
        className="icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
      </svg>
      <p className="font-bold">{message}</p>
    </div>
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
      if (
        filterPopupRef.current &&
        !filterPopupRef.current.contains(event.target)
      ) {
        setShowFilterPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id.toString()).then(() => {
      setSuccessMessage(`Copied ID: ${id}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    });
  };

  const handleRowDoubleClick = (p) => {
    navigate("/PaymentSingleDetails", {
      state: {
        payment: p.id,
        sidebarState: sidebarCollapsed,
      },
    });
  };

  const getAcronym = (courseName) => {
    return courseName
      .replace(/[\(\)\[\]]/g, "") // Remove brackets
      .replace(/[-–—]/g, " _HYPHEN_ ") // Temporarily mark hyphens
      .replace(/&/g, " _AMP_ ") // Temporarily mark ampersands
      .split(/\s+/) // Split by whitespace
      .filter((word) => word.length > 0) // Remove empty parts
      .map((word) => {
        if (word === "_HYPHEN_") return "-"; // Restore hyphen
        if (word === "_AMP_") return "&"; // Restore ampersand
        const letter = word[0].toUpperCase();
        return /[A-Z]/.test(letter) ? letter : "";
      })
      .join("");
  };

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? "expanded" : ""}`}>
      <div className="booking-content">
        <div className="page-header">
          <svg
            className="icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h1>Payments Main Details</h1>
        </div>

        <p className="page-description" style={{ fontWeight: "bold" }}>
          Manage and review all payment records related to course cost
          summaries.
        </p>

        {successMessage && <SuccessPopup message={successMessage} />}

        <div className="search-filter-container">
          <div className="searchbar">
            <div className="search-box">
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
                placeholder="Search by ID, course, stream, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="info-container" ref={infoRef}>
              <button
                className="info-icon-button"
                onClick={() => setShowInfo(!showInfo)}
                title="Show instructions"
              >
                <svg
                  className="info-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                  />
                </svg>
              </button>
              {showInfo && (
                <div className="info-popup">
                  <strong>&#127775; Tip:</strong>
                  <p>Double-click records to view more details.</p>
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <button
              className="filter-button"
              onClick={() => setShowFilterPopup(!showFilterPopup)}
            >
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
            </button>

            {showFilterPopup && (
              <div className="filter-popup" ref={filterPopupRef}>
                <div className="filter-section">
                  <h3>Status</h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Denied">Denied</option>
                  </select>
                </div>

                <div className="filter-section">
                  <h3>Month</h3>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i}>
                        {new Date(0, i).toLocaleString("en", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button className="reset-button" onClick={handleResetFilters}>
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Reset Filters
            </button>

            <button className="export-button" onClick={handleExport}>
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {getExportButtonText()} CSV
            </button>
          </div>
        </div>

        <div className="cls-booking-T">
          <table className="table-auto w-full border border-gray-300 booking-T">
            <thead>
              <tr className="bg-gray-100">
                <th>ID</th>
                <th>Course Name</th>
                <th>Stream</th>
                <th>Customer Type</th>
                <th>Participants</th>
                <th>Duration</th>
                <th>CTM Status</th>
                <th>CTM Details</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    No matching records found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    onDoubleClick={() => handleRowDoubleClick(p)}
                    className="border-t"
                  >
                    {/* <td>{p.id}</td> */}
                    <td className="flex items-center gap-2 justify-center id-c">
                      <button
                        onClick={() => copyToClipboard(p.id)}
                        className="text-blue-500 hover:underline id-btn"
                      >
                        {p.id}
                      </button>
                      <Copy
                        size={16}
                        onClick={() => copyToClipboard(p.id)}
                        className="cpy cursor-pointer"
                      />
                    </td>
                    <td title={p.course_name}>{getAcronym(p.course_name)}</td>
                    <td title={p.stream}>{getAcronym(p.stream)}</td>
                    <td>{p.customer_type}</td>
                    <td>{p.no_of_participants}</td>

                    {/* Editable Duration */}
                    <td>
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editValues.duration}
                          onChange={(e) =>
                            handleEditChange("duration", e.target.value)
                          }
                          className="Ptable-input"
                        />
                      ) : (
                        p.duration
                      )}
                    </td>

                    {/* Editable CTM Status */}
                    <td>
                      {editingId === p.id ? (
                        <select
                          value={editValues.CTM_approved}
                          onChange={(e) =>
                            handleEditChange("CTM_approved", e.target.value)
                          }
                          className="Ptable-select no-dropdown-arrow"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Denied">Denied</option>
                        </select>
                      ) : (
                        p.CTM_approved
                      )}
                    </td>

                    {/* Editable CTM Details */}
                    <td>
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editValues.CTM_details}
                          onChange={(e) =>
                            handleEditChange("CTM_details", e.target.value)
                          }
                          className="Ptable-input"
                        />
                      ) : (
                        p.CTM_details
                      )}
                    </td>

                    <td>{formatDate(p.date)}</td>

                    <td className="space-x-1">
                      {editingId === p.id ? (
                        <>
                          <button
                            onClick={() => handleSave(p.id)}
                            className="PsaveBtn-2"
                          >
                            <svg
                              className="icon-small mr-1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="PcancelBtn-2"
                          >
                            <svg
                              className="icon-small mr-1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(p.id);
                              setEditValues({
                                duration: p.duration || "",
                                CTM_approved: p.CTM_approved || "Pending",
                                CTM_details: p.CTM_details || "",
                              });
                            }}
                            className="editBtn-2"
                          >
                            <svg
                              className="icon-small"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="deleteBtn-2"
                          >
                            <svg
                              className="icon-small"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsMainDetails;
