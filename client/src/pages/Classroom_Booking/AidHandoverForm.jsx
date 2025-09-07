import React, { useEffect, useState, useRef } from "react";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Building,
  Check,
  XCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Key,
  Package,
  UserCheck,
} from "lucide-react";

const AidHandoverForm = () => {
  const [aidHandover, setAidHandover] = useState({
    request_id: "",
    items_taken_over: "",
    items_returned: "",
    receiver_name: "",
    receiver_designation: "",
    receiver_date: "",
    handover_confirmer_name: "",
    handover_confirmer_designation: "",
    handover_confirmer_date: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasLoadedAidHandover, setHasLoadedAidHandover] = useState(false);
  const [handoverRestoredFromLocal, setHandoverRestoredFromLocal] =
    useState(false);
  const [requestData, setRequestData] = useState(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedAidHandover = localStorage.getItem("aidHandoverData");
    if (savedAidHandover) {
      try {
        const parsedHandover = JSON.parse(savedAidHandover);
        setAidHandover(parsedHandover);
        setHandoverRestoredFromLocal(true);
        console.log(
          "Restored aidHandoverData from localStorage:",
          parsedHandover
        );
      } catch (e) {
        console.error("Failed to parse aidHandoverData:", e);
      }
    }
    setHasLoadedAidHandover(true);
  }, []);

  useEffect(() => {
    if (hasLoadedAidHandover) {
      localStorage.setItem("aidHandoverData", JSON.stringify(aidHandover));
      console.log("Saved aidHandoverData to localStorage:", aidHandover);
    }
  }, [aidHandover, hasLoadedAidHandover]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const clearAndRefresh = (keys) => {
    if (window.confirm("Are you sure you want to clear form data?")) {
      keys.forEach((key) => localStorage.removeItem(key));
      console.log("Cleared localStorage keys:", keys);

      setAidHandover({
        request_id: "",
        items_taken_over: "",
        items_returned: "",
        receiver_name: "",
        receiver_designation: "",
        receiver_date: "",
        handover_confirmer_name: "",
        handover_confirmer_designation: "",
        handover_confirmer_date: "",
      });

      setHandoverRestoredFromLocal(false);
      setRequestData(null);
      setErrorMessage("");
      setCurrentStep(1);
    }
  };

  const handleAidHandoverChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("date")) {
      const selectedDate = new Date(value);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // Check if the selected date is in the past
      if (name !== "receiver_date" && selectedDate < todayDate) {
        alert("You cannot select a past date.");
        return;
      }

      // If the field is `receiver_date`, compare with `handover_confirmer_date`
      if (name === "receiver_date" && aidHandover.handover_confirmer_date) {
        const handoverConfirmerDate = new Date(
          aidHandover.handover_confirmer_date
        );

        if (selectedDate > handoverConfirmerDate) {
          alert(
            "Receiver date cannot be later than the handover confirmer date."
          );
          return;
        }
      }

      // If the field is `handover_confirmer_date`, compare with `receiver_date`
      if (name === "handover_confirmer_date" && aidHandover.receiver_date) {
        const receiverDate = new Date(aidHandover.receiver_date);

        if (selectedDate < receiverDate) {
          alert(
            "Handover confirmer date cannot be earlier than the receiver date."
          );
          return;
        }
      }
    }

    setAidHandover((prev) => ({ ...prev, [name]: value }));
  };

  // const fetchAidRequestData = async (requestId) => {
  //   if (!requestId) return;

  //   setIsLoadingRequest(true);
  //   try {
  //     // Then get the original request data for auto-fill
  //     const requestResponse = await authRequest(
  //       "get",
  //       getApiUrl(`/aidrequests/${requestId}`)
  //     );

  //     // First try to get existing handover data
  //     const handoverResponse = await authRequest(
  //       "get",
  //       getApiUrl(`/aidhandover/request/${requestId}`)
  //     );

  //     console.log(requestResponse);

  //     if (requestResponse && requestResponse.success && requestResponse.data) {
  //       setRequestData(requestResponse.data);

  //       // Auto-fill items from the request data
  //       const itemsDescription =
  //         requestResponse.data.aid_items
  //           ?.map((item) => `${item.description} (Qty: ${item.quantity})`)
  //           .join(", ") || "";

  //       if (handoverResponse && !handoverResponse.error) {
  //         // If handover exists, use existing data
  //         setAidHandover({
  //           request_id: requestId,
  //           items_taken_over:
  //             handoverResponse.items_taken_over || itemsDescription,
  //           items_returned: handoverResponse.items_returned || "",
  //           receiver_name: handoverResponse.receiver_name || "",
  //           receiver_designation: handoverResponse.receiver_designation || "",
  //           receiver_date: handoverResponse.receiver_date || "",
  //           handover_confirmer_name:
  //             handoverResponse.handover_confirmer_name || "",
  //           handover_confirmer_designation:
  //             handoverResponse.handover_confirmer_designation || "",
  //           handover_confirmer_date:
  //             handoverResponse.handover_confirmer_date || "",
  //         });
  //       } else {
  //         // If no handover exists, auto-fill with request data
  //         setAidHandover((prev) => ({
  //           ...prev,
  //           request_id: requestId,
  //           items_taken_over: itemsDescription,
  //           items_returned: "",
  //           receiver_name: "",
  //           receiver_designation: "",
  //           receiver_date: "",
  //           handover_confirmer_name: "",
  //           handover_confirmer_designation: "",
  //           handover_confirmer_date: "",
  //         }));
  //       }
  //     } else {
  //       setErrorMessage("Request ID not found or invalid.");
  //       setRequestData(null);
  //       setAidHandover((prev) => ({
  //         ...prev,
  //         items_taken_over: "",
  //         items_returned: "",
  //         receiver_name: "",
  //         receiver_designation: "",
  //         receiver_date: "",
  //         handover_confirmer_name: "",
  //         handover_confirmer_designation: "",
  //         handover_confirmer_date: "",
  //       }));
  //     }
  //   } catch (err) {
  //     console.error("Failed to fetch request data:", err);
  //     setErrorMessage(
  //       "Failed to fetch request data. Please check the Request ID."
  //     );
  //     setRequestData(null);
  //   } finally {
  //     setIsLoadingRequest(false);
  //   }
  // };

  const fetchAidRequestData = async (requestId) => {
    if (!requestId) return;

    setIsLoadingRequest(true);
    try {
      // Always fetch the request first
      const requestResponse = await authRequest(
        "get",
        getApiUrl(`/aidrequests/${requestId}`)
      );

      if (requestResponse && requestResponse.success && requestResponse.data) {
        setRequestData(requestResponse.data);

        // Build items string for autofill
        const itemsDescription =
          requestResponse.data.aid_items
            ?.map((item) => `${item.description} (Qty: ${item.quantity})`)
            .join(", ") || "";

        // Try fetching handover data
        let handoverResponse = null;
        try {
          handoverResponse = await authRequest(
            "get",
            getApiUrl(`/aidhandover/request/${requestId}`)
          );
        } catch (err) {
          if (err.response?.status !== 404) {
            // rethrow only if it's not a "not found"
            throw err;
          }
        }

        if (handoverResponse && !handoverResponse.error) {
          // If handover exists, fill with that data
          setAidHandover({
            request_id: requestId,
            items_taken_over:
              handoverResponse.items_taken_over || itemsDescription,
            items_returned: handoverResponse.items_returned || "",
            receiver_name: handoverResponse.receiver_name || "",
            receiver_designation: handoverResponse.receiver_designation || "",
            receiver_date: handoverResponse.receiver_date || "",
            handover_confirmer_name:
              handoverResponse.handover_confirmer_name || "",
            handover_confirmer_designation:
              handoverResponse.handover_confirmer_designation || "",
            handover_confirmer_date:
              handoverResponse.handover_confirmer_date || "",
          });
        } else {
          // No handover yet → autofill from request data
          setAidHandover((prev) => ({
            ...prev,
            request_id: requestId,
            items_taken_over: itemsDescription,
            items_returned: itemsDescription,
            receiver_name: requestResponse.data.requesting_officer_name,
            receiver_designation: requestResponse.data.designation,
            receiver_date: requestResponse.data.date_from,
            handover_confirmer_name: "",
            handover_confirmer_designation: "",
            handover_confirmer_date: "",
          }));
        }
      } else {
        setErrorMessage("Request ID not found or invalid.");
        setRequestData(null);
        setAidHandover((prev) => ({
          ...prev,
          items_taken_over: "",
          items_returned: "",
          receiver_name: "",
          receiver_designation: "",
          receiver_date: "",
          handover_confirmer_name: "",
          handover_confirmer_designation: "",
          handover_confirmer_date: "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch request data:", err);
      setErrorMessage(
        "Failed to fetch request data. Please check the Request ID."
      );
      setRequestData(null);
    } finally {
      setIsLoadingRequest(false);
    }
  };

  // Debounce hook to reduce frequent calls on fast typing (optional but recommended)
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    React.useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  }

  const debouncedRequestId = useDebounce(aidHandover.request_id, 500);

  useEffect(() => {
    if (!handoverRestoredFromLocal && debouncedRequestId) {
      fetchAidRequestData(debouncedRequestId);
    }
  }, [debouncedRequestId, handoverRestoredFromLocal]);

  const validateAidHandover = (handover) => {
    const errors = [];
    const {
      request_id,
      items_taken_over,
      receiver_name,
      receiver_designation,
      receiver_date,
      handover_confirmer_name,
      handover_confirmer_designation,
      handover_confirmer_date,
    } = handover;

    // Required fields
    if (!request_id) errors.push("Request ID is required.");
    if (!items_taken_over) errors.push("Items taken over must be specified.");
    if (!receiver_name) errors.push("Receiver name is required.");
    if (!receiver_designation) errors.push("Receiver designation is required.");
    if (!receiver_date) errors.push("Receiver date is required.");
    if (!handover_confirmer_name) errors.push("Confirmer name is required.");
    if (!handover_confirmer_designation)
      errors.push("Confirmer designation is required.");
    if (!handover_confirmer_date) errors.push("Confirmer date is required.");

    // Date logic
    if (receiver_date && handover_confirmer_date) {
      const rd = new Date(receiver_date);
      const cd = new Date(handover_confirmer_date);
      if (rd > cd) {
        errors.push(
          "Receiver date cannot be after the handover confirmer date."
        );
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (handover_confirmer_date && new Date(handover_confirmer_date) < today) {
      errors.push("Confirmer date cannot be in the past.");
    }

    return errors;
  };

  const handleAidHandoverSave = async (e) => {
    e.preventDefault();

    if (currentStep !== totalSteps) {
      alert("Please complete all steps before submitting.");
      return;
    }

    const validationErrors = validateAidHandover(aidHandover);
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(" "));
      return;
    }

    // Existing validation here or rely on step validation
    if (!validateStep()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (!aidHandover.request_id) {
      setErrorMessage("Please enter a valid Request ID");
      return;
    }

    setIsSubmitting(true);
    try {
      await authRequest("patch", getApiUrl("/aidhandover"), aidHandover);
      setSuccessMessage("Aid Handover saved successfully!");

      // Optionally reset form if needed
      setAidHandover({
        request_id: "",
        items_taken_over: "",
        items_returned: "",
        receiver_name: "",
        receiver_designation: "",
        receiver_date: "",
        handover_confirmer_name: "",
        handover_confirmer_designation: "",
        handover_confirmer_date: "",
      });
      localStorage.removeItem("aidHandoverData");
      setHandoverRestoredFromLocal(false);
      setCurrentStep(1);
      console.log("Cleared aidHandoverData from localStorage");
    } catch (err) {
      console.error("Error saving aid handover:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to save aid handover. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const SuccessPopup = ({ message }) => {
    const popupRef = useRef(null);

    useEffect(() => {
      if (popupRef.current) {
        // Focus the popup to draw user attention
        popupRef.current.focus();
        // Scroll to ensure it's visible
        popupRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
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
              Your handover has been saved successfully!
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ErrorPopup = ({ message }) => {
    const popupRef = useRef(null);

    useEffect(() => {
      if (popupRef.current) {
        // Focus the popup to draw user attention
        popupRef.current.focus();
        // Scroll to ensure it's visible
        popupRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
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
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return (
          aidHandover.request_id !== "" &&
          aidHandover.items_taken_over &&
          aidHandover.items_returned
        );
      case 2:
        return (
          aidHandover.receiver_name &&
          aidHandover.receiver_designation &&
          aidHandover.receiver_date &&
          aidHandover.handover_confirmer_name &&
          aidHandover.handover_confirmer_designation &&
          aidHandover.handover_confirmer_date
        );
      case 3:
        // Final confirmation step: all required fields must be valid
        return (
          aidHandover.request_id &&
          aidHandover.receiver_name &&
          aidHandover.receiver_designation &&
          aidHandover.receiver_date &&
          aidHandover.handover_confirmer_name &&
          aidHandover.handover_confirmer_designation &&
          aidHandover.handover_confirmer_date
        );
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      setErrorMessage("Please fill in all required fields on this step.");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <>
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
      {errorMessage && <ErrorPopup message={errorMessage} />}

      <div className="w-full max-w-8xl mx-auto">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-3">
              <Key className="w-8 h-8 text-blue-600" />
              Handover Details Form
            </CardTitle>
            <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
              Fill out this form to submit or update Handover Details.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleAidHandoverSave} className="space-y-8">
              {/* Progress Bar */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  {[...Array(totalSteps)].map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;

                    return (
                      <React.Fragment key={stepNum}>
                        <div className="flex items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                              isActive
                                ? "bg-blue-600 text-white shadow-lg scale-110"
                                : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              stepNum
                            )}
                          </div>
                        </div>
                        {stepNum !== totalSteps && (
                          <div
                            className={`w-16 h-1 rounded-full transition-all duration-300 ${
                              isCompleted ? "bg-green-500" : "bg-slate-200"
                            }`}
                          ></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: Request ID */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-3 mb-2">
                      <Package className="w-6 h-6 text-blue-600" />
                      Step 1: Request Identification & Item Details
                    </h2>
                    <p className="text-slate-600">
                      Please provide the request ID and item details for
                      handover.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="request_id"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Request ID *{" "}
                        {isLoadingRequest && (
                          <span className="text-blue-600 text-xs ml-2">
                            Loading request data...
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Input
                          id="request_id"
                          type="number"
                          name="request_id"
                          value={aidHandover.request_id}
                          onChange={handleAidHandoverChange}
                          placeholder="Enter request ID to auto-fill items"
                          required
                          className="w-full pr-10"
                        />
                        {isLoadingRequest && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {requestData && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Found request for "{requestData.course_name}" by{" "}
                          {requestData.requesting_officer_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="items_taken_over"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Items Taken Over *
                      </label>
                      <Input
                        id="items_taken_over"
                        type="text"
                        name="items_taken_over"
                        value={aidHandover.items_taken_over}
                        onChange={handleAidHandoverChange}
                        placeholder="Enter items taken over"
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="items_returned"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Items Returned (Optional)
                      </label>
                      <Input
                        id="items_returned"
                        type="text"
                        name="items_returned"
                        value={aidHandover.items_returned}
                        onChange={handleAidHandoverChange}
                        placeholder="Enter items returned"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Receiver details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-3 mb-2">
                      <UserCheck className="w-6 h-6 text-blue-600" />
                      Step 2: Receiver & Confirmer Details
                    </h2>
                    <p className="text-slate-600">
                      Please provide the receiver and confirmer information.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="receiver_name"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Receiver Name *
                      </label>
                      <Input
                        id="receiver_name"
                        type="text"
                        name="receiver_name"
                        value={aidHandover.receiver_name}
                        onChange={handleAidHandoverChange}
                        placeholder="Enter receiver name"
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="handover_confirmer_name"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Handover Confirmer Name *
                      </label>
                      <Input
                        id="handover_confirmer_name"
                        type="text"
                        name="handover_confirmer_name"
                        value={aidHandover.handover_confirmer_name}
                        onChange={handleAidHandoverChange}
                        placeholder="Enter confirmer name"
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="receiver_designation"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Receiver Designation *
                      </label>
                      <Input
                        id="receiver_designation"
                        type="text"
                        name="receiver_designation"
                        value={aidHandover.receiver_designation}
                        onChange={handleAidHandoverChange}
                        placeholder="Enter receiver designation"
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="handover_confirmer_designation"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Handover Confirmer Designation *
                      </label>
                      <Input
                        id="handover_confirmer_designation"
                        type="text"
                        name="handover_confirmer_designation"
                        value={aidHandover.handover_confirmer_designation}
                        onChange={handleAidHandoverChange}
                        placeholder="Enter confirmer designation"
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="receiver_date"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Receiver Date *
                      </label>
                      <Input
                        id="receiver_date"
                        type="date"
                        name="receiver_date"
                        value={aidHandover.receiver_date}
                        onChange={handleAidHandoverChange}
                        min={today}
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="handover_confirmer_date"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Handover Confirmer Date *
                      </label>
                      <Input
                        id="handover_confirmer_date"
                        type="date"
                        name="handover_confirmer_date"
                        value={aidHandover.handover_confirmer_date}
                        onChange={handleAidHandoverChange}
                        min={aidHandover.receiver_date || today}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation step */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      Step 3: Review & Submit Your Handover
                    </h2>
                    <p className="text-slate-600 mt-2">
                      Please carefully review all information before submitting
                      your handover
                    </p>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 py-0">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-4 px-6 min-h-[60px] flex items-center">
                        <h3 className="text-lg font-semibold flex items-center gap-2 m-0">
                          <FileText className="w-5 h-5" />
                          Handover Details
                        </h3>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {Object.entries(aidHandover).map(([key, val]) => (
                            <div
                              key={key}
                              className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"
                            >
                              <span className="text-sm font-semibold text-slate-800 capitalize block mb-2">
                                {key === "request_id"
                                  ? "Request ID"
                                  : key === "items_taken_over"
                                  ? "Items Taken Over"
                                  : key === "items_returned"
                                  ? "Items Returned"
                                  : key === "receiver_name"
                                  ? "Receiver Name"
                                  : key === "receiver_designation"
                                  ? "Receiver Designation"
                                  : key === "receiver_date"
                                  ? "Receiver Date"
                                  : key === "handover_confirmer_name"
                                  ? "Handover Confirmer Name"
                                  : key === "handover_confirmer_designation"
                                  ? "Handover Confirmer Designation"
                                  : key === "handover_confirmer_date"
                                  ? "Handover Confirmer Date"
                                  : key.replaceAll("_", " ")}
                              </span>
                              <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                {val === null ||
                                val === undefined ||
                                val === "" ||
                                (Array.isArray(val) && val.length === 0)
                                  ? "Not specified"
                                  : Array.isArray(val)
                                  ? val.join(", ")
                                  : val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Display Request Information if available */}
                    {requestData && (
                      <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 py-0">
                        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg py-4 px-6 min-h-[60px] flex items-center">
                          <h3 className="text-lg font-semibold flex items-center gap-2 m-0">
                            <Package className="w-5 h-5" />
                            Original Request Information
                          </h3>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <span className="text-sm font-semibold text-slate-800 block mb-2">
                                Requesting Officer
                              </span>
                              <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                {requestData.requesting_officer_name ||
                                  "Not specified"}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <span className="text-sm font-semibold text-slate-800 block mb-2">
                                Course Name
                              </span>
                              <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                {requestData.course_name || "Not specified"}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <span className="text-sm font-semibold text-slate-800 block mb-2">
                                Request Status
                              </span>
                              <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                {requestData.request_status || "Not specified"}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <span className="text-sm font-semibold text-slate-800 block mb-2">
                                Total Aid Items
                              </span>
                              <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                {requestData.aid_items?.length || 0} items
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation and Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-slate-200">
                {/* Navigation buttons */}
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  )}
                  {currentStep < totalSteps && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  {currentStep === totalSteps && (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Submit Handover
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Clear and Cancel buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => clearAndRefresh(["aidHandoverData"])}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 rounded-xl font-bold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear Form
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-600 rounded-xl font-bold"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Request
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AidHandoverForm;
