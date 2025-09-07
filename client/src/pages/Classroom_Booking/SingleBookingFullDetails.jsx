import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useLocation } from "react-router-dom";
import { requestFields, handoverFields } from "./aidUtils";
import {
  FileText,
  User,
  Mail,
  Calendar,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  ArrowLeft,
  Info,
  Building,
  ArrowUpDown,
} from "lucide-react";

// Column header with sort functionality
const ColumnHeader = memo(
  ({
    title,
    sortable = false,
    sortKey,
    currentSort,
    onSort,
    className = "",
  }) => {
    const handleSort = useCallback(() => {
      if (sortable && onSort) {
        if (currentSort.key === sortKey) {
          onSort({
            key: sortKey,
            direction: currentSort.direction === "asc" ? "desc" : "asc",
          });
        } else {
          onSort({ key: sortKey, direction: "asc" });
        }
      }
    }, [sortable, sortKey, currentSort, onSort]);

    return (
      <th
        className={`text-left p-4 font-semibold text-slate-700 bg-slate-50 ${
          sortable
            ? "cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-all duration-200"
            : ""
        } ${className}`}
        onClick={handleSort}
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {sortable && (
            <ArrowUpDown
              className={`w-4 h-4 text-slate-600 ${
                currentSort.key === sortKey
                  ? "opacity-100 text-slate-800"
                  : "opacity-60"
              }`}
            />
          )}
        </div>
      </th>
    );
  }
);

ColumnHeader.displayName = "ColumnHeader";

const SingleBookingFullDetails = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );

  const request = location.state?.request;
  const handover = location.state?.handover;
  const items = request?.aid_items || [];

  // Sorting state for items table
  const [itemsSort, setItemsSort] = useState({
    key: "item_no",
    direction: "asc",
  });

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Sorting logic for items
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let valueA, valueB;

      switch (itemsSort.key) {
        case "item_no":
          valueA = parseInt(a.item_no) || 0;
          valueB = parseInt(b.item_no) || 0;
          break;
        case "description":
          valueA = a.description || "";
          valueB = b.description || "";
          break;
        case "quantity":
          valueA = parseInt(a.quantity) || 0;
          valueB = parseInt(b.quantity) || 0;
          break;
        case "remark":
          valueA = a.remark || "";
          valueB = b.remark || "";
          break;
        case "md_approval_required_or_not":
          valueA = a.md_approval_required_or_not || "";
          valueB = b.md_approval_required_or_not || "";
          break;
        case "md_approval_obtained":
          valueA = a.md_approval_obtained || "";
          valueB = b.md_approval_obtained || "";
          break;
        case "CTM_approval_obtained":
          valueA = a.CTM_approval_obtained || "";
          valueB = b.CTM_approval_obtained || "";
          break;
        default:
          valueA = parseInt(a.item_no) || 0;
          valueB = parseInt(b.item_no) || 0;
      }

      if (itemsSort.direction === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [items, itemsSort]);

  // Sorting handler for items
  const handleItemsSort = useCallback((sortConfig) => {
    setItemsSort(sortConfig);
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

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No Data Available
          </h3>
          <p className="text-slate-600">
            The requested booking details could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Helper function to get status styling
  const getStatusStyling = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "denied":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "denied":
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Booking Details
            </h1>
            <p className="text-slate-600 text-sm ml-4">
              Request ID: {request.id}
            </p>
          </div>
        </div>
      </div>

      {/* Request Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Request Information
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requestFields.map(({ label, key, getValue }) => {
              let value = getValue ? getValue(request) : request[key] || "-";

              // Apply time formatting during rendering
              if ((key === "time_from" || key === "time_to") && value !== "-") {
                value = formatTime(value);
              }

              if (
                (key === "date_from" ||
                  key === "date_to" ||
                  key === "signed_date") &&
                value !== "-"
              ) {
                value = formatDate(value);
              }

              return (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    {key === "requesting_officer_name" && (
                      <User className="h-4 w-4" />
                    )}
                    {key === "requesting_officer_email" && (
                      <Mail className="h-4 w-4" />
                    )}
                    {key === "course_name" && <BookOpen className="h-4 w-4" />}
                    {(key === "date_from" ||
                      key === "date_to" ||
                      key === "signed_date") && (
                      <Calendar className="h-4 w-4" />
                    )}
                    {(key === "time_from" || key === "time_to") && (
                      <Clock className="h-4 w-4" />
                    )}
                    {key === "classrooms_allocated" && (
                      <Building className="h-4 w-4" />
                    )}
                    {key === "no_of_participants" && (
                      <Users className="h-4 w-4" />
                    )}
                    {label}
                  </label>
                  {key === "request_status" ? (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyling(
                        value
                      )}`}
                    >
                      {getStatusIcon(value)}
                      {value}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-800 font-medium">
                        {value}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Requested Items Section */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Requested Items
            </h2>
          </div>
        </div>

        <div className="p-6">
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <ColumnHeader
                      title="Item No."
                      sortable={true}
                      sortKey="item_no"
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="Description"
                      sortable={true}
                      sortKey="description"
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="Quantity"
                      sortable={true}
                      sortKey="quantity"
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="Remark"
                      sortable={true}
                      sortKey="remark"
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="MD Approval Required"
                      sortable={true}
                      sortKey="md_approval_required_or_not"
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="MD Approval Obtained"
                      sortable={true}
                      sortKey="md_approval_obtained"
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="MD Approval Details"
                      sortable={false}
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="CTM Approval Obtained"
                      sortable={true}
                      sortKey="CTM_approval_obtained"
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                    <ColumnHeader
                      title="CTM Details"
                      sortable={false}
                      currentSort={itemsSort}
                      onSort={handleItemsSort}
                    />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {sortedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-sm text-slate-800">
                        {item.item_no}
                      </td>
                      <td className="p-4 text-sm text-slate-800">
                        {item.description}
                      </td>
                      <td className="p-4 text-sm text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="p-4 text-sm text-slate-800">
                        {item.remark}
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.md_approval_required_or_not === "Yes"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {item.md_approval_required_or_not}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.md_approval_obtained === "Yes"
                              ? "bg-green-100 text-green-800"
                              : item.md_approval_obtained === "No"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {item.md_approval_obtained}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-800">
                        {item.md_approval_details || "-"}
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.CTM_approval_obtained === "Yes"
                              ? "bg-green-100 text-green-800"
                              : item.CTM_approval_obtained === "No"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {item.CTM_approval_obtained}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-800">
                        {item.CTM_Details || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                No Items Found
              </h3>
              <p className="text-slate-600">
                No requested items are associated with this booking.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Handover Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Handover Details
            </h2>
          </div>
        </div>

        <div className="p-6">
          {handover ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {handoverFields.map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    {(key === "receiver_name" ||
                      key === "handover_confirmer_name") && (
                      <User className="h-4 w-4" />
                    )}
                    {(key === "receiver_date" ||
                      key === "handover_confirmer_date") && (
                      <Calendar className="h-4 w-4" />
                    )}
                    {(key === "items_taken_over" ||
                      key === "items_returned") && (
                      <Package className="h-4 w-4" />
                    )}
                    {label}
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-800 font-medium">
                      {handover[key] || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                No Handover Data
              </h3>
              <p className="text-slate-600">
                No handover information is available for this request.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleBookingFullDetails;
