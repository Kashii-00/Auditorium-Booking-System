import React, { useState, useEffect } from "react";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";

const DRAFT_KEY = "draftPayHerePaymentFormSDK";

const PayHerePaymentForm = ({
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          student_id: "",
          courseBatch_id: "",
          amount: "",
        };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payhereLoaded, setPayhereLoaded] = useState(false);

  // Load PayHere SDK once on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.payhere.lk/lib/payhere.js";
    script.async = true;

    script.onload = () => {
      console.log("✅ PayHere SDK loaded");
      setPayhereLoaded(true);
    };

    script.onerror = () => {
      console.error("❌ Failed to load PayHere SDK");
      setPayhereLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Save draft on formData changes
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({
      student_id: "",
      courseBatch_id: "",
      amount: "",
    });
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const student_id = Number(formData.student_id);
    const courseBatch_id = Number(formData.courseBatch_id);
    const amount = parseFloat(formData.amount);

    if (!student_id || !courseBatch_id || isNaN(amount) || amount <= 0) {
      setError(
        "Please enter valid Student ID, Course Batch ID, and Amount > 0"
      );
      return;
    }

    if (!payhereLoaded || !window.payhere) {
      setError("Payment service is not ready yet. Please wait a moment.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call backend to get PayHere payment data object
      const paymentData = await authRequest(
        "post",
        getApiUrl("/api/student_payments/payhere/initiate-payment"),
        { student_id, courseBatch_id, amount }
      );

      // Setup PayHere callbacks
      window.payhere.onCompleted = function (orderId) {
        console.log("✅ Payment completed. OrderID:", orderId);
        setSuccessMessage(
          "Payment completed successfully! Order ID: " + orderId
        );
        setIsSubmitting(false);
        // Optionally clear form or redirect here
        // handleClearForm();
      };

      window.payhere.onDismissed = function () {
        console.log("⚠️ Payment dismissed");
        setError("Payment was cancelled.");
        setIsSubmitting(false);
      };

      window.payhere.onError = function (error) {
        console.error("❌ Payment error:", error);
        setError("Payment failed: " + error);
        setIsSubmitting(false);
      };

      // Start payment with returned payment data from backend
      window.payhere.startPayment(paymentData);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to initiate payment. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const PROCESSING_FEE_PERCENT = 3.3;

  const grossAmount = formData.amount
    ? (
        parseFloat(formData.amount) /
        (1 - PROCESSING_FEE_PERCENT / 100)
      ).toFixed(2)
    : null;

  return (
    <div className="mainCostCon">
      <form className="aid-request-form-type2" onSubmit={handleSubmit}>
        <h2 className="page-description-type2 h2-type2">PayHere Payment</h2>

        {successMessage && (
          <div className="success-popup2">{successMessage}</div>
        )}
        {error && <div className="error-popup2">{error}</div>}

        <div className="step-two-grid aid-request-form-type2">
          <div className="form-step">
            <input
              type="number"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              min={1}
              placeholder=" "
              required
            />
            <label className={formData.student_id ? "active2" : ""}>
              Student ID
            </label>
          </div>

          <div className="form-step">
            <input
              type="number"
              name="courseBatch_id"
              value={formData.courseBatch_id}
              onChange={handleChange}
              min={1}
              placeholder=" "
              required
            />
            <label className={formData.courseBatch_id ? "active2" : ""}>
              Course Batch ID
            </label>
          </div>

          <div className="form-step">
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder=" "
              required
            />
            <label className={formData.amount ? "active2" : ""}>
              Amount to Pay (LKR)
            </label>
            {grossAmount && (
              <p style={{ fontSize: "0.9em", color: "#555", marginTop: "4px" }}>
                Total charged (including 3.30% processing fee): LKR{" "}
                {grossAmount}
              </p>
            )}
          </div>
        </div>

        <div className="form-buttons-sticky btnHalf">
          <div className="navigation-buttons">
            <button type="submit" disabled={isSubmitting} className="ccfbtn">
              {isSubmitting ? "Processing..." : "Pay with PayHere"}
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              className="ccfbtn"
              style={{ marginLeft: "10px" }}
              disabled={isSubmitting}
            >
              Clear Form
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PayHerePaymentForm;
