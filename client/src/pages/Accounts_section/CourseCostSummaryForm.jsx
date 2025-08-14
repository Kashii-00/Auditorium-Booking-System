import React, { useState, useEffect } from "react";
import { authRequest } from "../../services/authService";
import "./styles/styles.css";
import { getApiUrl } from '../../utils/apiUrl';
// import SpecialCasePaymentsForm from "./SpecialCasePaymentsForm";

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];

const normalizeRoles = (rawRole) => {
  if (!rawRole) return [];
  if (Array.isArray(rawRole)) return rawRole;
  try {
    return JSON.parse(rawRole);
  } catch {
    return [rawRole];
  }
};

const extractPrivilege = () => {
  try {
    const userString = localStorage.getItem("user");
    if (!userString) return false;
    const user = JSON.parse(userString);
    const roles = normalizeRoles(user?.role);
    return roles.some((r) => PRIVILEGED_ROLES.includes(r));
  } catch (e) {
    console.warn("Failed to extract user role:", e);
    return false;
  }
};

const CourseCostSummaryForm = ({
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const DRAFT_KEY = "draftCourseCostSummaryForm";

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          payment_main_details_id: "",
          check_by: "",
        };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    setIsPrivileged(extractPrivilege());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setError("");

    try {
      const payload = {
        payment_main_details_id: Number(formData.payment_main_details_id),
        check_by: formData.check_by || undefined,
      };

      await authRequest(
        "post",
        getApiUrl("/payment-course-final-summary"),
        payload
      );

      setSuccessMessage("Course cost summary created successfully.");
      handleClearForm(); // Clear form after successful submission
    } catch (err) {
      setError(
        err.response?.data?.error || "Submission failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSummary = async () => {
    const id = Number(formData.payment_main_details_id);
    if (!id) {
      setError("Please enter a valid Payment Main Details ID.");
      return;
    }

    setIsFetchingSummary(true);
    setError("");
    setSummary(null);

    try {
      const response = await authRequest(
        "get",
        getApiUrl(`/payment-course-final-summary/${id}`)
      );
      setSummary(response);
      console.log("Summary fetched:", response);
      setSuccessMessage("Summary fetched successfully.");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to fetch summary. Try again."
      );
    } finally {
      setIsFetchingSummary(false);
    }
  };

  const handleClearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({
      payment_main_details_id: "",
      check_by: "",
    });
    setSummary(null);
  };

  return (
    <div className="mainCostCon">
      <form className="aid-request-form-type2" onSubmit={handleSubmit}>
        <h2 className="page-description-type2 h2-type2">
          Fill Out The Generate Course Cost Summary{" "}
          {isPrivileged && <span style={{ color: "cyan" }}>(PRIVILEGED)</span>}
        </h2>

        {successMessage && (
          <div className="success-popup2">{successMessage}</div>
        )}
        {error && <div className="error-popup2">{error}</div>}
        {/* {fetchError && <div className="error-popup2">{fetchError}</div>} */}
        <div className="step-two-grid aid-request-form-type2">
          <div className="form-step">
            <input
              type="number"
              name="payment_main_details_id"
              value={formData.payment_main_details_id}
              onChange={handleChange}
              min={1}
              placeholder=" "
              required
            />
            <label
              className={formData.payment_main_details_id ? "active2" : ""}
            >
              Payment Main Details ID
            </label>
          </div>

          <div className="form-step">
            <input
              type="text"
              name="check_by"
              value={formData.check_by}
              onChange={handleChange}
              placeholder=" "
              maxLength={255}
            />
            <label className={formData.check_by ? "active2" : ""}>
              Checked By (optional)
            </label>
          </div>
        </div>

        <div className="form-buttons-sticky btnHalf">
          <div className="navigation-buttons">
            <button type="submit" disabled={isSubmitting} className="ccfbtn">
              {isSubmitting ? "Submitting..." : "Generate Summary"}
            </button>
            <button
              type="button"
              onClick={handleViewSummary}
              className="ccfbtn"
              disabled={isFetchingSummary}
              style={{ marginLeft: "10px" }}
            >
              {isFetchingSummary ? "Fetching..." : "View Summary"}
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="ccfbtn"
              style={{ marginLeft: "10px" }}
            >
              Clear Form
            </button>
          </div>
        </div>
      </form>
      {summary && (
        <div className="review2Con">
          <h2>Course Cost Summary</h2>
          <div className="step-two-grid aid-request-form-type2">
            <div>
              <strong>Total Cost Expense:</strong> Rs.{" "}
              {summary.total_cost_expense}
            </div>
            <div>
              <strong>Profit Margin Percentage:</strong>{" "}
              {summary.profit_margin_percentage}%
            </div>
            <div>
              <strong>Profit Margin:</strong> Rs. {summary.profit_margin}
            </div>
            <div>
              <strong>Provision for Inflation Percentage:</strong>{" "}
              {summary.provision_inflation_percentage}%
            </div>
            <div>
              <strong>NBT:</strong> Rs. {summary.NBT}
            </div>
            <div>
              <strong>Total Course Cost:</strong> Rs.{" "}
              {summary.total_course_cost}
            </div>
            <div>
              <strong>No. of Participants:</strong> {summary.no_of_participants}
            </div>
            <div>
              <strong>Course Fee / Head:</strong> Rs.{" "}
              {summary.course_fee_per_head}
            </div>
            <div>
              <strong>Rounded CFPH:</strong> Rs. {summary.Rounded_CFPH}
            </div>
            <div>
              <strong>Rounded CT:</strong> Rs. {summary.Rounded_CT}
            </div>
            <div>
              <strong>Prepared By:</strong> {summary.prepared_by}
            </div>
            <div>
              <strong>Checked By:</strong> {summary.check_by}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCostSummaryForm;
