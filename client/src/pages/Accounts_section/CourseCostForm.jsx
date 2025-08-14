import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { authRequest } from "../../services/authService";
import "./styles/styles2.css";
import { getApiUrl } from '../../utils/apiUrl';
import MainCourseCostSection from "./MainCourseCostSection";
import CourseDevelopmentWorkForm from "./CourseDevelopmentWorkForm";
import CourseDeliveryCostForm from "./CourseDeliveryCostForm";
import CourseOverheadsForm from "./CourseOverheadsForm";
import CourseCostSummaryForm from "./CourseCostSummaryForm";
import SpecialCasePaymentsForm from "./SpecialCasePaymentsForm";
import PayHerePaymentForm from "./PayHerePaymentForm";

const defaultForm = {
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

  return (
    <div
      className={`content-wrapper ${
        sidebarCollapsed ? "expanded" : ""
      } form-wp2 course-cost-form`}
    >
      {successMessage && <div className="success-popup2">{successMessage}</div>}
      {error && <div className="error-popup2">{error}</div>}
      <div className="page-header-type2">
        <h1>Course Cost Calculation Form</h1>
      </div>
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

      {storedCourseCostId && (
        <div className="PMD_id-box">
          <p>
            <strong>Saved Payments Details ID:</strong>{" "}
            <span className="PMD_id-text">{storedCourseCostId}</span>
            <button
              className="PMD_copy-btn"
              onClick={() => copyToClipboard(storedCourseCostId)}
            >
              Copy
            </button>
            <button
              className="PMD_clear-btn"
              onClick={() => {
                localStorage.removeItem("mainCourseCostId");
                setStoredCourseCostId("");
              }}
            >
              Clear
            </button>
          </p>
        </div>
      )}
      <div className="form-navigation-buttons">
        {stepLabels.map((label, index) => {
          const num = index + 1;
          return (
            <button
              key={num}
              type="button"
              className={`ccfbtn ${step === num ? "active" : ""}`}
              onClick={() => setStep(num)}
              aria-current={step === num ? "step" : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCostForm;
