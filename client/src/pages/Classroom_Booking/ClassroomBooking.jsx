import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authRequest } from "../../services/authService";
import { Copy } from "lucide-react";
import "./styles/ClassroomBooking.css";

const ClassroomBooking = () => {
  const location = useLocation();
  const [aidRequests, setAidRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );
  const highlightId = location.state?.highlightId
    ? Number(location.state.highlightId)
    : null;
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const filterPopupRef = useRef(null);
  const infoRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);

  const [handoverDataList, setHandoverDataList] = useState([]);

  const navigate = useNavigate();

  const [filtersLoaded, setFiltersLoaded] = useState(false);

  useEffect(() => {
    const savedFilters = localStorage.getItem("classroomBookingFilters");
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
    setFiltersLoaded(true); // ✅ only after filters are restored
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return; // ⛔ don’t save until restoration is done

    const filtersToStore = {
      searchTerm,
      filterStatus,
      filterMonth,
    };
    console.log("✅ Saving to localStorage:", filtersToStore);
    localStorage.setItem(
      "classroomBookingFilters",
      JSON.stringify(filtersToStore)
    );
  }, [searchTerm, filterStatus, filterMonth, filtersLoaded]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterStatus("ALL");
    setFilterMonth("ALL");
    localStorage.removeItem("classroomBookingFilters");
  };

  useEffect(() => {
    fetchAidRequests();
  }, []);

  useEffect(() => {
    const fetchHandoverData = async () => {
      try {
        const response = await authRequest(
          "get",
          "http://localhost:5003/api/aidhandover"
        );
        console.log("Fetched handovers:", response);
        setHandoverDataList(response);
      } catch (error) {
        console.error("Error fetching handover data:", error);
      }
    };

    fetchHandoverData();
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

  const fetchAidRequests = async () => {
    setLoading(true);
    try {
      const response = await authRequest(
        "get",
        "http://localhost:5003/api/aidrequests"
      );
      const data = response.data;
      setAidRequests(data.success ? data.data : data);
    } catch (error) {
      console.error("Error fetching aid requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      // Get the full request object by ID
      const requestToUpdate = aidRequests.find((req) => req.id === id);
      if (!requestToUpdate) {
        console.error(`Request with ID ${id} not found.`);
        return;
      }

      let payment_status = requestToUpdate.payment_status; // Default: keep existing

      if (status === "Approved") {
        if (requestToUpdate.paid_course_or_not === "Yes") {
          payment_status = "Paid";
        }
      } else if (status === "Denied") {
        if (requestToUpdate.paid_course_or_not === "Yes") {
          payment_status = "Cancelled";
        }
      }

      await authRequest("put", `http://localhost:5003/api/aidrequests/${id}`, {
        request_status: status,
        payment_status,
      });
      setSuccessMessage(`Request ${id} marked as ${status}`);
      fetchAidRequests();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error(`Error updating request ${id} to ${status}:`, error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await authRequest(
        "delete",
        `http://localhost:5003/api/aidrequests/${id}`
      );
      setSuccessMessage(`Request ${id} deleted`);
      fetchAidRequests();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error(`Error deleting request ${id}:`, error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setSuccessMessage(`Copied ID: ${text}`);
        setTimeout(() => setSuccessMessage(""), 3000);
      })
      .catch(() => {
        setSuccessMessage("Failed to copy ID");
        setTimeout(() => setSuccessMessage(""), 3000);
      });
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

  const filteredRequests = aidRequests.filter((req) => {
    const matchesSearch =
      req.requesting_officer_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      req.requesting_officer_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      req.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id?.toString().includes(searchTerm);

    const matchesStatus =
      filterStatus === "ALL" ||
      req.request_status?.toLowerCase() === filterStatus.toLowerCase();

    const matchesMonth =
      filterMonth === "ALL" ||
      new Date(req.date_from).getMonth() === parseInt(filterMonth);

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
      "Request ID",
      "Officer Name",
      "Designation",
      "Email",
      "Course",
      "Duration",
      "Audience",
      "Participants",
      "Coordinator",
      "Signed Date",
      "Status",
    ];

    const data = filteredRequests.map((req) => [
      req.id,
      req.requesting_officer_name,
      req.designation,
      req.requesting_officer_email,
      req.course_name,
      req.duration,
      req.audience_type,
      req.no_of_participants,
      req.course_coordinator,
      req.signed_date,
      req.request_status,
    ]);

    let filename = "aid_requests";
    if (filterStatus !== "ALL") {
      filename += `_${filterStatus.toLowerCase()}`;
    }
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
      filename += `_${monthNames[parseInt(filterMonth)]}`;
    }
    filename += ".csv";

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
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterPopupRef.current &&
        !filterPopupRef.current.contains(event.target)
      ) {
        setShowFilterPopup(false);
      }

      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    }

    if (showFilterPopup || showInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterPopup, showInfo]);

  const handleRowDoubleClick = (req) => {
    const matchingHandover = handoverDataList.find(
      (h) => Number(h.request_id) === Number(req.id)
    );

    navigate("/singlebookingdetails", {
      state: {
        request: req,
        handover: matchingHandover || null,
        sidebarState: sidebarCollapsed,
      },
    });
  };

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? "expanded" : ""} `}>
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
          <h1>Classroom Booking Details</h1>
        </div>

        <p className="page-description" style={{ fontWeight: "bold" }}>
          Manage and review all Classroom booking requests in one place.
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
                placeholder="Search by name, email, request ID or course..."
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
                  <strong>&#127775;Tip:</strong>
                  <p>
                    Double-Click records to view more details in the table
                    below.
                  </p>
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
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DENIED">Denied</option>
                  </select>
                </div>

                <div className="filter-section">
                  <h3>Month</h3>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="ALL">All Months</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
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
                <th>Request ID</th>
                <th>Officer Name</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Course Name</th>
                <th>Duration</th>
                <th>Signed Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <React.Fragment key={req.id}>
                    <tr
                      onDoubleClick={() => handleRowDoubleClick(req)}
                      className={`border-t ${
                        highlightId === req.id ? "bg-yellow-100" : ""
                      }`}
                    >
                      <td className="flex items-center gap-2 justify-center id-c">
                        <button
                          onClick={() => copyToClipboard(req.id)}
                          className="text-blue-500 hover:underline id-btn"
                        >
                          {req.id}
                        </button>
                        <Copy
                          size={16}
                          onClick={() => copyToClipboard(req.id)}
                          className="cpy cursor-pointer"
                        />
                      </td>
                      <td>{req.requesting_officer_name}</td>
                      <td>{req.designation}</td>
                      <td>{req.requesting_officer_email}</td>
                      <td title={req.course_name}>
                        {getAcronym(req.course_name)}
                      </td>
                      <td>{req.duration}</td>
                      <td>{formatDate(req.signed_date)}</td>
                      <td>
                        <span
                          className={`status-badge status-${
                            req.request_status?.toLowerCase() || "pending"
                          }`}
                        >
                          {req.request_status?.toUpperCase() === "PENDING" && (
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          {req.request_status?.toUpperCase() === "APPROVED" && (
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {req.request_status?.toUpperCase() === "DENIED" && (
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                          {req.request_status || "Pending"}
                        </span>
                      </td>

                      <td className="space-x-1">
                        {req.request_status?.toLowerCase() === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(req.id, "Approved")
                              }
                              className="approveBtn-2"
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(req.id, "Denied")
                              }
                              className="denyBtn-2"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Deny
                            </button>
                            <button
                              onClick={() => handleDelete(req.id)}
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
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="text-center py-4">
                    No matching requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassroomBooking;
