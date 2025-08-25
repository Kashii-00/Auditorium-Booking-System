import React, { useEffect, useState, useRef } from "react";
import { authRequest } from "../../services/authService"
import { getApiUrl } from '../../utils/apiUrl';
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
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>;
      case "Denied":
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Denied</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">{status}</Badge>;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">Cancel Request Management</CardTitle>
                <p className="text-slate-600 mt-1">Search and cancel aid requests or specific booking dates</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Search Section */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">Search Aid Request</CardTitle>
                </div>
                <p className="text-slate-600 text-sm">
                  Search for booking requests with request ID and cancel the whole request.
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

            {/* Success/Error Messages */}
            {successMessage && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <Check className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800 font-medium">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

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
                    {requestFields.map(({ label, key, getValue, highlight }) => {
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
                          <div className={`text-sm text-slate-800 p-2 rounded-lg border ${
                            highlight ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"
                          }`}>
                            {value}
                          </div>
                        </div>
                      );
                    })}
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
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">Item No.</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">Description</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">Quantity</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">Remark</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">MD Approval Required</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">MD Approval Obtained</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">MD Approval Details</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">CTM Approval Obtained</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">CTM Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {requestData.aid_items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.item_no}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.description}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.remark}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.md_approval_required_or_not}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.md_approval_obtained}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.md_approval_details || "—"}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.CTM_approval_obtained}</td>
                                <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">{item.CTM_Details || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-center py-4">No items found.</p>
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
                          This request has been approved and cannot be cancelled.
                        </AlertDescription>
                      </Alert>
                    )}
                    {requestData.request_status === "Denied" && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800 font-medium">
                          This request has been cancelled before and cannot be cancelled again.
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
                    <CardTitle className="text-lg font-semibold text-slate-800">Cancel Specific Booking Dates</CardTitle>
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
                  Search for booking requests with request ID and cancel specific booking dates for a request.
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
