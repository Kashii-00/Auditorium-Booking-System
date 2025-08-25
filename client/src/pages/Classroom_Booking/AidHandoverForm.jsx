import React, { useEffect, useState } from "react";
import { authRequest } from "../../services/authService"
import { getApiUrl } from '../../utils/apiUrl';
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
  const [hasLoadedAidHandover, setHasLoadedAidHandover] = useState(false);
  const [handoverRestoredFromLocal, setHandoverRestoredFromLocal] =
    useState(false);
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
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  const fetchAidHandoverByRequestId = async (requestId) => {
    if (!requestId) return;

    try {
      const response = await authRequest(
        "get",
        getApiUrl(`/aidhandover/request/${requestId}`)
      );
      if (response && !response.error) {
        setAidHandover({
          request_id: requestId,
          items_taken_over: response.items_taken_over || "",
          items_returned: response.items_returned || "",
          receiver_name: response.receiver_name || "",
          receiver_designation: response.receiver_designation || "",
          receiver_date: response.receiver_date || "",
          handover_confirmer_name: response.handover_confirmer_name || "",
          handover_confirmer_designation:
            response.handover_confirmer_designation || "",
          handover_confirmer_date: response.handover_confirmer_date || "",
        });
      } else {
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
      console.error("Failed to fetch aid handover:", err);
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
      fetchAidHandoverByRequestId(debouncedRequestId);
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
      alert(validationErrors.join("\n"));
      return;
    }

    // Existing validation here or rely on step validation
    if (!validateStep()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!aidHandover.request_id) {
      alert("Please enter a valid Request ID");
      return;
    }

    setIsSubmitting(true);
    try {
      await authRequest(
        "patch",
        getApiUrl("/aidhandover"),
        aidHandover
      );
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
      setSuccessMessage("Error saving aid handover");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SuccessPopup = ({ message }) => (
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-lg">{message}</p>
          <p className="text-emerald-100 text-sm">Your handover has been saved successfully</p>
        </div>
      </div>
    </div>
  );

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
      alert("Please fill in all required fields on this step.");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <>
      {successMessage && <SuccessPopup message={successMessage} />}
      
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
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-lg scale-110' 
                              : isCompleted 
                                ? 'bg-green-500 text-white' 
                                : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isCompleted ? <Check className="w-6 h-6" /> : stepNum}
                          </div>
                        </div>
                        {stepNum !== totalSteps && (
                          <div className={`w-16 h-1 rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : 'bg-slate-200'
                          }`}></div>
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
                    <p className="text-slate-600">Please provide the request ID and item details for handover.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="request_id" className="text-sm font-semibold text-slate-700">
                        Request ID *
                      </label>
                      <Input
                        id="request_id"
                        type="number"
                        name="request_id"
                        value={aidHandover.request_id}
                        onChange={handleAidHandoverChange}
                        placeholder="Enter request ID"
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="items_taken_over" className="text-sm font-semibold text-slate-700">
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
                      <label htmlFor="items_returned" className="text-sm font-semibold text-slate-700">
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
                    <p className="text-slate-600">Please provide the receiver and confirmer information.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="receiver_name" className="text-sm font-semibold text-slate-700">
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
                      <label htmlFor="handover_confirmer_name" className="text-sm font-semibold text-slate-700">
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
                      <label htmlFor="receiver_designation" className="text-sm font-semibold text-slate-700">
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
                      <label htmlFor="handover_confirmer_designation" className="text-sm font-semibold text-slate-700">
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
                      <label htmlFor="receiver_date" className="text-sm font-semibold text-slate-700">
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
                      <label htmlFor="handover_confirmer_date" className="text-sm font-semibold text-slate-700">
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
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-3 mb-2">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                      Step 3: Confirm your details and submit
                    </h2>
                    <p className="text-slate-600">Please review all the information before submitting.</p>
                  </div>

                  <Card className="border border-slate-200 bg-slate-50/50">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Request ID</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.request_id}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Items Taken Over</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.items_taken_over}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Items Returned</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.items_returned || "(none)"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Receiver Name</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.receiver_name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Receiver Designation</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.receiver_designation}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Receiver Date</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.receiver_date}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Handover Confirmer Name</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.handover_confirmer_name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Handover Confirmer Designation</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.handover_confirmer_designation}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600">Handover Confirmer Date</p>
                          <p className="text-lg font-bold text-slate-800">{aidHandover.handover_confirmer_date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
