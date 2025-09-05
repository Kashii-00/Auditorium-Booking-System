import React, { useEffect, useState, useRef } from "react";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import { requestFields } from "./aidUtils";
import CancelBookingDatesSection from "./CancelBookingDatesSection";

// Import Shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  X,
  Check,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Clock,
  Users,
  Trash2,
  RotateCcw,
} from "lucide-react";

// Memoized Success popup component with focus management
const SuccessPopup = React.memo(({ message }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (popupRef.current) {
      // Focus the popup to draw user attention
      popupRef.current.focus();
      // Scroll to ensure it's visible
      popupRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  return (
    <div
      ref={popupRef}
      tabIndex={-1}
      className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-6 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-500 border border-white/20 backdrop-blur-xl max-w-md focus:outline-none focus:ring-4 focus:ring-emerald-300"
      style={{
        animation:
          "slideInFromRight 0.5s ease-out, pulse 0.8s ease-in-out 0.3s",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
          <Check className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-black text-lg leading-tight">{message}</p>
          <p className="text-emerald-100 text-sm mt-1">
            Action completed successfully!
          </p>
        </div>
      </div>
    </div>
  );
});

SuccessPopup.displayName = "SuccessPopup";

// Memoized Error popup component with focus management
const ErrorPopup = React.memo(({ message }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (popupRef.current) {
      // Focus the popup to draw user attention
      popupRef.current.focus();
      // Scroll to ensure it's visible
      popupRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  return (
    <div
      ref={popupRef}
      tabIndex={-1}
      className="fixed top-6 right-6 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-8 py-6 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-500 border border-white/20 backdrop-blur-xl max-w-md focus:outline-none focus:ring-4 focus:ring-red-300"
      style={{
        animation:
          "slideInFromRight 0.5s ease-out, shake 0.6s ease-in-out 0.3s",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <XCircle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-black text-lg leading-tight">Error</p>
          <p className="text-red-100 text-sm mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
});

ErrorPopup.displayName = "ErrorPopup";

const CancelRequestForm = () => {
  const [requestIdInput, setRequestIdInput] = useState("");
  const [requestData, setRequestData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const successTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const [showCancelSection, setShowCancelSection] = useState(false);

  const useDebouncedEffect = (effect, deps, delay) => {
    const timeoutRef = useRef();

    useEffect(() => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(effect, delay);

      return () => clearTimeout(timeoutRef.current);
    }, deps);
  };

  useDebouncedEffect(
    () => {
      const trimmed = requestIdInput.trim();
      if (trimmed.length >= 1) {
        fetchRequestData();
      } else {
        setRequestData(null);
      }
    },
    [requestIdInput],
    500
  );

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

  const fetchRequestData = async () => {
    if (!requestIdInput.trim()) {
      setError("Please enter a request ID.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setRequestData(null);
    setIsLoading(true);

    try {
      const response = await authRequest(
        "get",
        getApiUrl(`/aidrequests/${requestIdInput}`)
      );

      console.log("✅ Full response from backend:", response);

      if (!response?.success) {
        throw new Error("Server did not confirm success.");
      }

      const result = response.data;

      if (!result || typeof result !== "object") {
        throw new Error("Invalid aid request structure received.");
      }

      setRequestData(result);
    } catch (err) {
      console.error(" Error fetching aid request:", err);
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to fetch aid request."
      );
      setRequestData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRequest = async () => {
    if (!requestData?.id) return;

    try {
      const payload = {
        request_status: "Denied",
        cancelled_by_requester: "Yes",
      };

      await authRequest(
        "put",
        getApiUrl(`/aidrequests/cancel-or-update/${requestData.id}`),
        payload
      );

      await fetchRequestData();

      setSuccessMessage("Request cancelled successfully.");
    } catch (err) {
      console.error(" Error cancelling aid request:", err);
      setError(err?.response?.data?.error || "Failed to cancel the request.");
    }
  };

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
    const stored = localStorage.getItem("sidebarState");
    if (stored !== null) {
      const isCollapsed = stored === "true";
      setSidebarCollapsed(isCollapsed);
    }

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
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            Approved
          </Badge>
        );
      case "Denied":
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Denied
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-200">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 transition-all duration-300`}
    >
      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>

      {successMessage && <SuccessPopup message={successMessage} />}
      {error && <ErrorPopup message={error} />}

      <div className="max-w-7xl mx-auto">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">
                  Cancel Request Management
                </CardTitle>
                <p className="text-slate-600 mt-1">
                  Search and cancel aid requests or specific booking dates
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Search Section */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Search Aid Request
                  </CardTitle>
                </div>
                <p className="text-slate-600 text-sm">
                  Search for booking requests with request ID and cancel the
                  whole request.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Enter Request ID"
                      value={requestIdInput}
                      onChange={(e) => setRequestIdInput(e.target.value)}
                      className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                    />
                  </div>
                  <Button
                    onClick={fetchRequestData}
                    disabled={!requestIdInput.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            {requestData && (
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg font-semibold text-slate-800">
                        Request Details (ID: {requestData.id})
                      </CardTitle>
                    </div>
                    {getStatusBadge(requestData.request_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requestFields.map(
                      ({ label, key, getValue, highlight }) => {
                        let value = getValue
                          ? getValue(requestData)
                          : requestData[key] || "-";

                        // Apply time formatting during rendering
                        if (
                          (key === "time_from" || key === "time_to") &&
                          value !== "-"
                        ) {
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
                          <div key={key} className="space-y-1">
                            <label className="text-sm font-semibold text-slate-600 capitalize">
                              {label}:
                            </label>
                            <div
                              className={`text-sm text-slate-800 p-2 rounded-lg border ${
                                highlight
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              {value}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Requested Items Table */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Requested Items
                    </h3>
                    {requestData.aid_items?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                Item No.
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                Description
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                Quantity
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                Remark
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                MD Approval Required
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                MD Approval Obtained
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                MD Approval Details
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                CTM Approval Obtained
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                                CTM Details
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {requestData.aid_items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.item_no}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.description}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.remark}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.md_approval_required_or_not}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.md_approval_obtained}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.md_approval_details || "—"}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.CTM_approval_obtained}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                                  {item.CTM_Details || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-center py-4">
                        No items found.
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={cancelRequest}
                      disabled={
                        requestData.request_status === "Denied" ||
                        requestData.request_status === "Approved"
                      }
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Request
                    </Button>
                    <Button
                      onClick={() => {
                        setRequestIdInput("");
                        setRequestData(null);
                        setError("");
                        setSuccessMessage("");
                      }}
                      variant="outline"
                      className="border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg font-semibold"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>

                  {/* Status Messages */}
                  <div className="mt-4">
                    {requestData.request_status === "Approved" && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 font-medium">
                          This request has been approved and cannot be
                          cancelled.
                        </AlertDescription>
                      </Alert>
                    )}
                    {requestData.request_status === "Denied" && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800 font-medium">
                          This request has been cancelled before and cannot be
                          cancelled again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Cancel Specific Dates Section */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      Cancel Specific Booking Dates
                    </CardTitle>
                  </div>
                  <Button
                    onClick={() => setShowCancelSection((prev) => !prev)}
                    variant="outline"
                    className="border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg font-semibold"
                  >
                    {showCancelSection ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Hide Section
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Show Section
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-slate-600 text-sm">
                  Search for booking requests with request ID and cancel
                  specific booking dates for a request.
                </p>
              </CardHeader>
              {showCancelSection && (
                <CardContent>
                  <CancelBookingDatesSection
                    onSuccess={setSuccessMessage}
                    onError={setError}
                  />
                </CardContent>
              )}
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CancelRequestForm;

// import React, { useEffect, useState, useRef } from "react";
// import { authRequest } from "../../services/authService"
// import { getApiUrl } from '../../utils/apiUrl';
// import "./styles/details.css";
// import { requestFields } from "./aidUtils";
// import CancelBookingDatesSection from "./CancelBookingDatesSection";

// const CancelRequestForm = () => {
//   const [requestIdInput, setRequestIdInput] = useState("");
//   const [requestData, setRequestData] = useState(null);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   const successTimeoutRef = useRef(null);
//   const errorTimeoutRef = useRef(null);

//   const [showCancelSection, setShowCancelSection] = useState(false);

//   const useDebouncedEffect = (effect, deps, delay) => {
//     const timeoutRef = useRef();

//     useEffect(() => {
//       clearTimeout(timeoutRef.current);
//       timeoutRef.current = setTimeout(effect, delay);

//       return () => clearTimeout(timeoutRef.current);
//     }, deps);
//   };

//   useDebouncedEffect(
//     () => {
//       const trimmed = requestIdInput.trim();
//       if (trimmed.length >= 1) {
//         fetchRequestData();
//       } else {
//         setRequestData(null);
//       }
//     },
//     [requestIdInput],
//     500
//   );

//   const formatTime = (timeStr) => {
//     const [h, m] = timeStr.split(":").map(Number);
//     const date = new Date();
//     date.setHours(h, m);
//     return date.toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   const fetchRequestData = async () => {
//     if (!requestIdInput.trim()) {
//       setError("Please enter a request ID.");
//       return;
//     }

//     setError("");
//     setSuccessMessage("");

//     setRequestData(null);

//     try {
//       const response = await authRequest(
//         "get",
//         getApiUrl(`/aidrequests/${requestIdInput}`)
//       );

//       console.log("✅ Full response from backend:", response);

//       if (!response?.success) {
//         throw new Error("Server did not confirm success.");
//       }

//       const result = response.data;

//       if (!result || typeof result !== "object") {
//         throw new Error("Invalid aid request structure received.");
//       }

//       setRequestData(result);
//     } catch (err) {
//       console.error(" Error fetching aid request:", err);
//       setError(
//         err?.response?.data?.error ||
//           err.message ||
//           "Failed to fetch aid request."
//       );
//       setRequestData(null);
//     }
//   };

//   const cancelRequest = async () => {
//     if (!requestData?.id) return;

//     try {
//       const payload = {
//         request_status: "Denied",
//         cancelled_by_requester: "Yes",
//       };

//       await authRequest(
//         "put",
//         getApiUrl(`/aidrequests/cancel-or-update/${requestData.id}`),
//         payload
//       );

//       await fetchRequestData();

//       setSuccessMessage(" Request cancelled successfully.");
//     } catch (err) {
//       console.error(" Error cancelling aid request:", err);
//       setError(err?.response?.data?.error || "Failed to cancel the request.");
//     }
//   };

//   useEffect(() => {
//     if (successMessage) {
//       if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
//       successTimeoutRef.current = setTimeout(() => {
//         setSuccessMessage("");
//       }, 5000);
//     }
//   }, [successMessage]);

//   useEffect(() => {
//     if (error) {
//       if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
//       errorTimeoutRef.current = setTimeout(() => {
//         setError("");
//       }, 5000);
//     }
//   }, [error]);

//   useEffect(() => {
//     const stored = localStorage.getItem("sidebarState");
//     if (stored !== null) {
//       const isCollapsed = stored === "true";
//       setSidebarCollapsed(isCollapsed);
//     }

//     const handleSidebarToggle = (e) => {
//       setSidebarCollapsed(e.detail.isCollapsed);
//       localStorage.setItem("sidebarState", e.detail.isCollapsed);
//     };

//     const handleSidebarHover = (e) => {
//       setSidebarCollapsed(!e.detail.isHovered);
//     };

//     window.addEventListener("sidebarToggle", handleSidebarToggle);
//     window.addEventListener("sidebarHover", handleSidebarHover);

//     return () => {
//       window.removeEventListener("sidebarToggle", handleSidebarToggle);
//       window.removeEventListener("sidebarHover", handleSidebarHover);
//     };
//   }, []);

//   return (
//     <div
//       className={`content-wrapper ${
//         sidebarCollapsed ? "expanded" : ""
//       } form-wp`}
//       id="clsBooking"
//     >
//       <div className="details-container">
//         <h2 className="text-xl font-bold mb-4">Search Aid Request</h2>

//         <p className="search-TXT">
//           Search for Booking request with request Id and Cancel the whole
//           request.
//         </p>
//         <p className="search-TXT">
//           <div class="triangle-down"></div>
//         </p>

//         <div className="searchRequest-Con">
//           <div className="search-bar-wrapper">
//             <input
//               type="text"
//               placeholder="Enter Request ID"
//               value={requestIdInput}
//               onChange={(e) => setRequestIdInput(e.target.value)}
//               className="input-field"
//             />
//             <button
//               onClick={fetchRequestData}
//               className="search-icon-btn"
//               disabled={!requestIdInput.trim()}
//               aria-label="Search"
//             >
//               <svg
//                 className="icon"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {successMessage && (
//           <div className="success-popup2" role="alert" aria-live="assertive">
//             <svg
//               xmlns="https://www.w3.org/2000/svg"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               width="20"
//               height="20"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={3}
//                 d="M5 13l4 4L19 7"
//               />
//             </svg>
//             {successMessage}
//           </div>
//         )}

//         {error && (
//           <div className="error-popup2" role="alert" aria-live="assertive">
//             <svg
//               xmlns="https://www.w3.org/2000/svg"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               width="20"
//               height="20"
//             >
//               <circle cx="12" cy="12" r="10" strokeWidth={2} />
//               <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
//               <circle cx="12" cy="16" r="1" fill="currentColor" />
//             </svg>
//             {error}
//           </div>
//         )}

//         {requestData && (
//           <>
//             <h3 className="text-lg font-bold mb-2">
//               Request Details (ID: {requestData.id})
//             </h3>
//             <div className="review-grid">
//               {requestFields.map(({ label, key, getValue, highlight }) => {
//                 let value = getValue
//                   ? getValue(requestData)
//                   : requestData[key] || "-";

//                 // Apply time formatting during rendering
//                 if (
//                   (key === "time_from" || key === "time_to") &&
//                   value !== "-"
//                 ) {
//                   value = formatTime(value);
//                 }

//                 if (
//                   (key === "date_from" ||
//                     key === "date_to" ||
//                     key === "signed_date") &&
//                   value !== "-"
//                 ) {
//                   value = formatDate(value);
//                 }
//                 // Base class
//                 let valueClass = "value";
//                 // Add highlight class if needed
//                 if (highlight) {
//                   valueClass += " highlight-status";
//                 }
//                 // Add status-specific class
//                 if (key === "request_status") {
//                   if (value === "Approved") {
//                     valueClass += " status-A";
//                   } else if (value === "Denied" || value === "Rejected") {
//                     valueClass += " status-D";
//                   } else if (value === "pending") {
//                     valueClass += " status-P";
//                   }
//                 }
//                 return (
//                   <React.Fragment key={key}>
//                     <div className="label">{label}:</div>
//                     <div className={valueClass}>{value}</div>
//                   </React.Fragment>
//                 );
//               })}
//             </div>

//             <h3 className="mt-4 font-semibold">Requested Items</h3>
//             <div className="bkContainer">
//               {requestData.aid_items?.length > 0 ? (
//                 <table className="bookingk">
//                   <thead>
//                     <tr>
//                       <th>Item no.</th>
//                       <th>Description</th>
//                       <th>Quantity</th>
//                       <th>Remark</th>
//                       <th>MD Approval required</th>
//                       <th>MD Approval obtained</th>
//                       <th>MD Approval Details</th>
//                       <th>CTM Approval Obtained</th>
//                       <th>CTM Details</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {requestData.aid_items.map((item, idx) => (
//                       <tr key={idx}>
//                         <td>{item.item_no}</td>
//                         <td>{item.description}</td>
//                         <td>{item.quantity}</td>
//                         <td>{item.remark}</td>
//                         <td>{item.md_approval_required_or_not}</td>
//                         <td>{item.md_approval_obtained}</td>
//                         <td>{item.md_approval_details || "—"}</td>
//                         <td>{item.CTM_approval_obtained}</td>
//                         <td>{item.CTM_Details || "-"}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p>No items found.</p>
//               )}
//             </div>

//             <div className="btn-Con">
//               <button
//                 onClick={cancelRequest}
//                 className="s_r_cancelBtn"
//                 disabled={
//                   requestData.request_status === "Denied" ||
//                   requestData.request_status === "Approved"
//                 }
//               >
//                 Cancel Request
//               </button>
//             </div>
//             <div className="msg-Con">
//               {requestData.request_status === "Approved" && (
//                 <p className="msgCancelReq">
//                   {"\u26A0"} This request has been approved and cannot be
//                   cancelled.
//                 </p>
//               )}
//               {requestData.request_status === "Denied" && (
//                 <p className="msgCancelReq">
//                   {"\u26A0"} This request has been cancelled before and cannot
//                   be cancelled again.
//                 </p>
//               )}
//             </div>
//           </>
//         )}
//         <hr></hr>
//         {/* <p className="search-TXT">Or</p> */}
//         <p className="search-TXT">
//           Search for Booking request with request Id and cancel specific booking
//           for a request.
//         </p>
//         <p className="search-TXT">
//           <div class="triangle-down"></div>
//         </p>
//         {/* INSERT Cancel Booking Dates UI here */}
//         <div className="cancel-dates-toggle">
//           <button
//             onClick={() => setShowCancelSection((prev) => !prev)}
//             className="cancel-btn"
//           >
//             {showCancelSection
//               ? "Hide Cancel Booked Dates"
//               : "Open Cancel Booked Dates"}
//           </button>
//         </div>

//         {showCancelSection && (
//           <CancelBookingDatesSection
//             onSuccess={setSuccessMessage}
//             onError={setError}
//           />
//         )}
//         {/* END Cancel Booking Dates Section */}
//       </div>
//     </div>
//   );
// };

// export default CancelRequestForm;
