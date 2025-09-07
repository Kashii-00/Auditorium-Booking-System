import React, { useState, useEffect, useRef } from "react";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";

const DRAFT_KEY_ONLINE = "draftPayHerePaymentFormSDK";
const DRAFT_KEY_MANUAL_FIRST = "draftManualFirstPaymentForm";
const DRAFT_KEY_MANUAL_FOLLOW = "draftManualFollowupPaymentForm";

const PROCESSING_FEE_PERCENT = 3.3;

const PayHerePaymentForm = ({
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const [step, setStep] = useState("choice");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payhereLoaded, setPayhereLoaded] = useState(false);
  const manualFirstFileRef = useRef(null);
  const manualFollowFileRef = useRef(null);

  // ==== Online payment form state ====
  const [onlineForm, setOnlineForm] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY_ONLINE);
    return saved
      ? JSON.parse(saved)
      : { student_id: "", courseBatch_id: "", amount: "" };
  });

  // ==== Manual first instalment state ====
  const [manualFirstForm, setManualFirstForm] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY_MANUAL_FIRST);
    return saved
      ? JSON.parse(saved)
      : { student_id: "", courseBatch_id: "", amount_paid: "" };
  });
  const [manualFirstFile, setManualFirstFile] = useState(null);

  // ==== Manual follow-up instalment state ====
  const [manualFollowForm, setManualFollowForm] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY_MANUAL_FOLLOW);
    return saved ? JSON.parse(saved) : { payment_id: "", amount_paid: "" };
  });
  const [manualFollowFile, setManualFollowFile] = useState(null);

  // Shared manual payment feedback
  const [manualSuccess, setManualSuccess] = useState("");
  const [manualError, setManualError] = useState("");

  // ==== Load PayHere SDK once ====
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.payhere.lk/lib/payhere.js";
    script.async = true;
    script.onload = () => setPayhereLoaded(true);
    script.onerror = () => setPayhereLoaded(false);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // ==== Draft save ====
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY_ONLINE, JSON.stringify(onlineForm));
  }, [onlineForm]);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY_MANUAL_FIRST,
      JSON.stringify(manualFirstForm)
    );
  }, [manualFirstForm]);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY_MANUAL_FOLLOW,
      JSON.stringify(manualFollowForm)
    );
  }, [manualFollowForm]);

  // ==== clear manual feedback messages ====
  useEffect(() => {
    if (manualError) {
      const timer = setTimeout(() => setManualError(""), 5000);
      return () => clearTimeout(timer); // cleanup
    }
  }, [manualError]);

  useEffect(() => {
    if (manualSuccess) {
      const timer = setTimeout(() => setManualSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [manualSuccess]);

  // ==== Handlers for form change ====
  const handleOnlineChange = (e) => {
    const { name, value } = e.target;
    setOnlineForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualFirstChange = (e) => {
    const { name, value } = e.target;
    setManualFirstForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualFollowChange = (e) => {
    const { name, value } = e.target;
    setManualFollowForm((prev) => ({ ...prev, [name]: value }));
  };

  // ==== Clear forms ====
  const clearOnlineForm = () => {
    localStorage.removeItem(DRAFT_KEY_ONLINE);
    setOnlineForm({ student_id: "", courseBatch_id: "", amount: "" });
  };

  const clearManualFirstForm = () => {
    localStorage.removeItem(DRAFT_KEY_MANUAL_FIRST);
    setManualFirstForm({ student_id: "", courseBatch_id: "", amount_paid: "" });
    setManualFirstFile(null);
    if (manualFirstFileRef.current) {
      manualFirstFileRef.current.value = "";
    }
  };

  const clearManualFollowForm = () => {
    localStorage.removeItem(DRAFT_KEY_MANUAL_FOLLOW);
    setManualFollowForm({ payment_id: "", amount_paid: "" });
    setManualFollowFile(null);
    if (manualFollowFileRef.current) {
      manualFollowFileRef.current.value = "";
    }
  };

  // ==== Submit: Online ====
  const handleOnlineSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const student_id = Number(onlineForm.student_id);
    const courseBatch_id = Number(onlineForm.courseBatch_id);
    const amount = parseFloat(onlineForm.amount);

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
      const paymentData = await authRequest(
        "post",
        getApiUrl("/api/student_payments/payhere/initiate-payment"),
        { student_id, courseBatch_id, amount }
      );

      window.payhere.onCompleted = function (orderId) {
        setSuccessMessage(
          "Payment completed successfully! Order ID: " + orderId
        );
        setIsSubmitting(false);
      };
      window.payhere.onDismissed = function () {
        setError("Payment was cancelled.");
        setIsSubmitting(false);
      };
      window.payhere.onError = function (error) {
        setError("Payment failed: " + error);
        setIsSubmitting(false);
      };

      window.payhere.startPayment(paymentData);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initiate payment.");
      setIsSubmitting(false);
    }
  };

  // ==== Submit: Manual First Instalment ====
  const handleManualFirstSubmit = async (e) => {
    e.preventDefault();
    setManualError("");
    setManualSuccess("");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("student_id", manualFirstForm.student_id);
      formData.append("courseBatch_id", manualFirstForm.courseBatch_id);
      formData.append("amount_paid", manualFirstForm.amount_paid);
      if (manualFirstFile) formData.append("payment_proof", manualFirstFile);

      await authRequest("post", getApiUrl("/api/student_payments"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setManualSuccess("First instalment recorded and pending approval.");
      clearManualFirstForm();
    } catch (err) {
      setManualError(err.response?.data?.error || "Failed to submit payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==== Submit: Manual Follow-up Instalment ====
  const handleManualFollowupSubmit = async (e) => {
    e.preventDefault();
    setManualError("");
    setManualSuccess("");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount_paid", manualFollowForm.amount_paid);
      if (manualFollowFile) formData.append("payment_proof", manualFollowFile);

      await authRequest(
        "patch",
        getApiUrl(`/api/student_payments/${manualFollowForm.payment_id}`),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setManualSuccess("Follow-up instalment recorded and pending approval.");
      clearManualFollowForm();
    } catch (err) {
      setManualError(err.response?.data?.error || "Failed to submit payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==== Gross amount for online ====
  const grossAmount = onlineForm.amount
    ? (
        parseFloat(onlineForm.amount) /
        (1 - PROCESSING_FEE_PERCENT / 100)
      ).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mb-3 shadow-lg">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Secure Payment
          </h1>
          <p className="text-gray-600 text-sm">
            Complete your course payment safely and securely
          </p>
        </div>

        {/* Step: Payment Method Selection */}
        {step === "choice" && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
              Choose Payment Method
            </h2>
            <p className="text-gray-600 mb-6 text-center text-sm">
              Select your preferred payment option below
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="group relative bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => setStep("online")}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold">Pay Online</span>
                  <span className="text-blue-100 text-xs text-center">
                    Instant payment with PayHere
                  </span>
                </div>
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <button
                className="group relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => setStep("manual")}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold">Manual Payment</span>
                  <span className="text-emerald-100 text-xs text-center">
                    Bank transfer or cash payment
                  </span>
                </div>
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        )}

        {/* Step: Manual Payment Choice */}
        {step === "manual" && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
              Manual Payment
            </h2>
            <p className="text-gray-600 mb-6 text-center text-sm">
              Is this your first instalment?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <button
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => setStep("manual-first")}
              >
                <div className="text-center">
                  <div className="font-semibold mb-1">First Instalment</div>
                  <div className="text-blue-100 text-xs">
                    Initial course payment
                  </div>
                </div>
              </button>

              <button
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => setStep("manual-followup")}
              >
                <div className="text-center">
                  <div className="font-semibold mb-1">Follow-up Instalment</div>
                  <div className="text-emerald-100 text-xs">
                    Additional payment
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep("choice")}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Payment Selection
              </button>
            </div>
          </div>
        )}

        {/* Step: Manual First Instalment Form */}
        {step === "manual-first" && (
          <form
            onSubmit={handleManualFirstSubmit}
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-2xl rounded-xl p-4 animate-slide-up space-y-4"
          >
            {/* Form Header */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                First Instalment Payment
              </h2>
              <p className="text-gray-600 mt-1 text-xs">
                Upload your payment proof
              </p>
            </div>

            {/* Success Message */}
            {manualSuccess && (
              <div className="flex items-center p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {manualSuccess}
              </div>
            )}

            {/* Error Message */}
            {manualError && (
              <div className="flex items-center p-2 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {manualError}
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="number"
                  name="student_id"
                  value={manualFirstForm.student_id}
                  onChange={handleManualFirstChange}
                  placeholder="Enter your student ID"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Course Batch ID
                </label>
                <input
                  type="number"
                  name="courseBatch_id"
                  value={manualFirstForm.courseBatch_id}
                  onChange={handleManualFirstChange}
                  placeholder="Enter course batch ID"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Paid (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount_paid"
                  value={manualFirstForm.amount_paid}
                  onChange={handleManualFirstChange}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Proof
                </label>
                <div className="relative">
                  <input
                    type="file"
                    ref={manualFirstFileRef}
                    onChange={(e) => setManualFirstFile(e.target.files[0])}
                    accept="image/*,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="w-full p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 transition-colors bg-white/30 backdrop-blur-sm cursor-pointer">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-5 h-5 text-gray-400 mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-gray-600 text-sm">
                        {manualFirstFile
                          ? manualFirstFile.name
                          : "Upload receipt or proof"}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PNG, JPG or PDF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-md text-sm"
              >
                {isSubmitting ? "Submitting..." : "Submit Payment"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setManualError("");
                  setManualSuccess("");
                  setStep("manual");
                }}
                className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Back
              </button>
            </div>
          </form>
        )}
        {/* Step: Manual Follow-up Instalment Form */}
        {step === "manual-followup" && (
          <form
            onSubmit={handleManualFollowupSubmit}
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-2xl rounded-xl p-4 animate-slide-up space-y-4"
          >
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Follow-up Instalment
              </h2>
              <p className="text-gray-600 mt-1 text-xs">
                Continue your payment plan
              </p>
            </div>

            {manualSuccess && (
              <div className="flex items-center p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {manualSuccess}
              </div>
            )}

            {manualError && (
              <div className="flex items-center p-2 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {manualError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Payment Record ID
                </label>
                <input
                  type="number"
                  name="payment_id"
                  value={manualFollowForm.payment_id}
                  onChange={handleManualFollowChange}
                  placeholder="Enter payment record ID"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Paid (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount_paid"
                  value={manualFollowForm.amount_paid}
                  onChange={handleManualFollowChange}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Proof
                </label>
                <div className="relative">
                  <input
                    type="file"
                    ref={manualFollowFileRef}
                    onChange={(e) => setManualFollowFile(e.target.files[0])}
                    accept="image/*,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="w-full p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-emerald-400 transition-colors bg-white/30 backdrop-blur-sm cursor-pointer">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-5 h-5 text-gray-400 mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-gray-600 text-sm">
                        {manualFollowFile
                          ? manualFollowFile.name
                          : "Upload receipt or proof"}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PNG, JPG or PDF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-2 rounded-md hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-md text-sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-1 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  "Submit Payment"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setManualError("");
                  setManualSuccess("");
                  setStep("manual");
                }}
                className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step: Online Payment Form */}
        {step === "online" && (
          <form
            onSubmit={handleOnlineSubmit}
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-2xl rounded-xl p-4 animate-slide-up space-y-4"
          >
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                PayHere Payment
              </h2>
              <p className="text-gray-600 mt-1 text-xs">
                Secure online payment processing
              </p>
            </div>

            {successMessage && (
              <div className="flex items-center p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {successMessage}
              </div>
            )}

            {error && (
              <div className="flex items-center p-2 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="number"
                  name="student_id"
                  value={onlineForm.student_id}
                  onChange={handleOnlineChange}
                  placeholder="Enter your student ID"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Course Batch ID
                </label>
                <input
                  type="number"
                  name="courseBatch_id"
                  value={onlineForm.courseBatch_id}
                  onChange={handleOnlineChange}
                  placeholder="Enter course batch ID"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount to Pay (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={onlineForm.amount}
                  onChange={handleOnlineChange}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm"
                  required
                />
                {grossAmount && (
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs">
                    <p className="text-blue-800">
                      <span className="font-semibold">Total charged</span>{" "}
                      (including {PROCESSING_FEE_PERCENT}% processing fee):
                      <span className="font-bold ml-1">LKR {grossAmount}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-md text-sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-1 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Pay with PayHere"
                )}
              </button>

              <button
                type="button"
                onClick={clearOnlineForm}
                className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
                disabled={isSubmitting}
              >
                Clear
              </button>
            </div>

            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => setStep("choice")}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 text-xs"
              >
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Payment Selection
              </button>
            </div>
          </form>
        )}
      </div>
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PayHerePaymentForm;
