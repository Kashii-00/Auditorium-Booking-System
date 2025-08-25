import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { authRequest } from "../../services/authService";
import "./styles/styles2.css";
import { getApiUrl } from '../../utils/apiUrl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DollarSign,
  Calculator,
  UserCheck,
  Copy,
  Clipboard,
} from "lucide-react";
import MainCourseCostSection from "./MainCourseCostSection";
import CourseDevelopmentWorkForm from "./CourseDevelopmentWorkForm";
import CourseDeliveryCostForm from "./CourseDeliveryCostForm";
import CourseOverheadsForm from "./CourseOverheadsForm";
import CourseCostSummaryForm from "./CourseCostSummaryForm";
import SpecialCasePaymentsForm from "./SpecialCasePaymentsForm";
import PayHerePaymentForm from "./PayHerePaymentForm";

const defaultForm = {
  course_id: "",
  course_name: "",
  no_of_participants: "",
  duration: "",
  customer_type: "",
  stream: "",
  CTM_approved: "Pending",
  CTM_details: "",
  special_justifications: "",
  date: "",

  accountant_approval_obtained: "Pending",
  accountant_details: "",

  sectional_approval_obtained: "Pending",
  section_type: "",
  sectional_details: "",

  DCTM01_approval_obtained: "Pending",
  DCTM01_details: "",

  DCTM02_approval_obtained: "Pending",
  DCTM02_details: "",
};

const CourseCostForm = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("draftMainCourseForm");
    return saved ? JSON.parse(saved) : defaultForm;
  });
  const [focused, setFocused] = useState({});
  const [reviewMode, setReviewMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const [step, setStep] = useState(1);

  const stepLabels = [
    "Main Course Cost",
    "Development Work",
    "Delivery Cost",
    "Overheads",
    "Special Payment Request",
    "Cost Summary",
    "Student Payment",
  ];

  const [storedCourseCostId, setStoredCourseCostId] = useState(
    () => localStorage.getItem("mainCourseCostId") || ""
  );

  useEffect(() => {
    if (location.state?.step) {
      setStep(location.state.step);
    }
  }, [location.state]);

  useEffect(() => {
    if (successMessage) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setError("");
      }, 5000);
    }
  }, [error]);

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

  const validateForm = () => {
    if (!formData.course_name) return "Course name is required.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) return setError(err);
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        no_of_participants: formData.no_of_participants
          ? +formData.no_of_participants
          : null,
      };
      const res = await authRequest(
        "post",
        getApiUrl("/payments"),
        payload
      );
      setSuccessMessage(`Record created with ID: ${res.id}`);
      localStorage.setItem("mainCourseCostId", res.id);
      setStoredCourseCostId(res.id);
      handleClear();
    } catch (err) {
      setError(err.response?.data?.error ?? "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem("draftMainCourseForm");
    localStorage.removeItem("isManualEntry");
    setFormData(defaultForm);
    setReviewMode(false);
    setError("");
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id.toString()).then(() => {
      setSuccessMessage(`Copied ID: ${id}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    });
  };

  const SuccessPopup = ({ message }) => (
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-lg">{message}</p>
          <p className="text-emerald-100 text-sm">Your course cost details have been saved successfully</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {successMessage && <SuccessPopup message={successMessage} />}
      
      <div className="w-full max-w-9xl mx-auto">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-3">
                  <Calculator className="w-8 h-8 text-blue-600" />
                  Course Cost Calculation Form
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  Complete course cost calculation and payment processing
                </p>
              </div>
              
              {/* Saved Course Cost ID Display */}
              {storedCourseCostId && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg mt-5 px-5 py-3">
                  <Badge className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    ID
                  </Badge>
                  <span className="font-mono text-sm font-bold text-blue-800">
                    {storedCourseCostId}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(storedCourseCostId)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-100 h-6 px-2 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        localStorage.removeItem("mainCourseCostId");
                        setStoredCourseCostId("");
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-100 h-6 px-2 text-xs"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Step Navigation */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 justify-center">
                {stepLabels.map((label, index) => {
                  const num = index + 1;
                  return (
                    <Button
                      key={num}
                      type="button"
                      variant={step === num ? "default" : "outline"}
                      onClick={() => setStep(num)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        step === num 
                          ? "bg-blue-600 text-white shadow-lg" 
                          : "border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      {step === num && <CheckCircle className="w-4 h-4" />}
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              {step === 1 && (
                <MainCourseCostSection
                  formData={formData}
                  setFormData={setFormData}
                  focused={focused}
                  setFocused={setFocused}
                  reviewMode={reviewMode}
                  setReviewMode={setReviewMode}
                  isSubmitting={isSubmitting}
                  successMessage={successMessage}
                  error={error}
                  handleSubmit={handleSubmit}
                  handleClear={handleClear}
                />
              )}

              {step === 2 && (
                <CourseDevelopmentWorkForm
                  successMessage={successMessage}
                  setSuccessMessage={setSuccessMessage}
                  error={error}
                  setError={setError}
                />
              )}

              {step === 3 && (
                <CourseDeliveryCostForm
                  successMessage={successMessage}
                  setSuccessMessage={setSuccessMessage}
                  error={error}
                  setError={setError}
                  step={step}
                  currentStep={3}
                  setStep={setStep}
                />
              )}
              {step === 4 && (
                <CourseOverheadsForm
                  successMessage={successMessage}
                  setSuccessMessage={setSuccessMessage}
                  error={error}
                  setError={setError}
                  step={step}
                  currentStep={4}
                  setStep={setStep}
                />
              )}
              {step === 5 && (
                <SpecialCasePaymentsForm
                  successMessage={successMessage}
                  setSuccessMessage={setSuccessMessage}
                  error={error}
                  setError={setError}
                  step={step}
                  currentStep={5}
                  setStep={setStep}
                />
              )}

              {step === 6 && (
                <CourseCostSummaryForm
                  successMessage={successMessage}
                  setSuccessMessage={setSuccessMessage}
                  error={error}
                  setError={setError}
                  step={step}
                  currentStep={6}
                  setStep={setStep}
                />
              )}

              {step === 7 && (
                <PayHerePaymentForm
                  successMessage={successMessage}
                  setSuccessMessage={setSuccessMessage}
                  error={error}
                  setError={setError}
                  step={step}
                  currentStep={7}
                  setStep={setStep}
                />
              )}
            </div>


          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CourseCostForm;
