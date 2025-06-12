import React, { useEffect, useState } from "react";
import { authRequest } from "../../services/authService";
import "./styles/aidHandover.css";

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
        `http://localhost:5003/api/aidhandover/request/${requestId}`
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
        "http://localhost:5003/api/aidhandover",
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
    <div className="success-popup">
      <svg
        className="icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
      </svg>
      <p className="font-bold">{message}</p>
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
      <form
        onSubmit={handleAidHandoverSave}
        className="aid-request-form-type2"
        id="aidh"
      >
        <div className="page-header">
          <h1>Handover Details Form</h1>
        </div>
        <p className="page-description" style={{ fontWeight: "bold" }}>
          Fill out this form to submit or update Handover Details.
        </p>

        <div className="progressbar-container">
          {[...Array(totalSteps)].map((_, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            return (
              <React.Fragment key={stepNum}>
                <div
                  className={`progress-step ${isActive ? "active" : ""} ${
                    isCompleted ? "completed" : ""
                  }`}
                >
                  <div className="circle">{stepNum}</div>
                </div>
                {stepNum !== totalSteps && (
                  <div
                    className={`line ${isCompleted ? "completed" : ""}`}
                  ></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Request ID */}
        {currentStep === 1 && (
          <>
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 1: Request Identification & Item Details
            </p>
            <div className="centered-form-section">
              <div className="form-step half-width">
                <input
                  id="request_id"
                  type="number"
                  name="request_id"
                  value={aidHandover.request_id}
                  onChange={handleAidHandoverChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="request_id">Request ID</label>
              </div>
              <div className="form-step half-width">
                <input
                  id="items_taken_over"
                  type="text"
                  name="items_taken_over"
                  value={aidHandover.items_taken_over}
                  onChange={handleAidHandoverChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="items_taken_over">Items Taken Over</label>
              </div>
              <div className="form-step half-width">
                <input
                  id="items_returned"
                  type="text"
                  name="items_returned"
                  value={aidHandover.items_returned}
                  onChange={handleAidHandoverChange}
                  placeholder=" "
                />
                <label htmlFor="items_returned">
                  Items Returned (optional)
                </label>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Receiver details */}
        {currentStep === 2 && (
          <>
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 2: Receiver & Confirmer Details
            </p>
            <div className="step-two-grid">
              <div className="form-step">
                <input
                  id="receiver_name"
                  type="text"
                  name="receiver_name"
                  value={aidHandover.receiver_name}
                  onChange={handleAidHandoverChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="receiver_name">Receiver Name</label>
              </div>
              <div className="form-step">
                <input
                  id="handover_confirmer_name"
                  type="text"
                  name="handover_confirmer_name"
                  value={aidHandover.handover_confirmer_name}
                  onChange={handleAidHandoverChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="handover_confirmer_name">
                  Handover Confirmer Name
                </label>
              </div>
              <div className="form-step">
                <input
                  id="receiver_designation"
                  type="text"
                  name="receiver_designation"
                  value={aidHandover.receiver_designation}
                  onChange={handleAidHandoverChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="receiver_designation">
                  Receiver Designation
                </label>
              </div>
              <div className="form-step">
                <input
                  id="handover_confirmer_designation"
                  type="text"
                  name="handover_confirmer_designation"
                  value={aidHandover.handover_confirmer_designation}
                  onChange={handleAidHandoverChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="handover_confirmer_designation">
                  Handover Confirmer Designation
                </label>
              </div>
              <div className="form-step">
                <input
                  id="receiver_date"
                  type="date"
                  name="receiver_date"
                  value={aidHandover.receiver_date}
                  onChange={handleAidHandoverChange}
                  min={today}
                  placeholder=" "
                  required
                />
                <label htmlFor="receiver_date">Receiver Date</label>
              </div>

              <div className="form-step">
                <input
                  id="handover_confirmer_date"
                  type="date"
                  name="handover_confirmer_date"
                  value={aidHandover.handover_confirmer_date}
                  onChange={handleAidHandoverChange}
                  min={aidHandover.receiver_date || today}
                  placeholder=" "
                  required
                />
                <label htmlFor="handover_confirmer_date">
                  Handover Confirmer Date
                </label>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Confirmation step */}
        {currentStep === 3 && (
          <div className="form-step confirmation-step">
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 3: Confirm your details and submit
            </p>

            <div className="review-grid-1">
              <p>
                <strong>Request ID:</strong> {aidHandover.request_id}
              </p>
              <p>
                <strong>Items Taken Over:</strong>{" "}
                {aidHandover.items_taken_over}
              </p>
              <p>
                <strong>Items Returned:</strong>{" "}
                {aidHandover.items_returned || "(none)"}
              </p>
              <p>
                <strong>Receiver Name:</strong> {aidHandover.receiver_name}
              </p>
              <p>
                <strong>Receiver Designation:</strong>{" "}
                {aidHandover.receiver_designation}
              </p>
              <p>
                <strong>Receiver Date:</strong> {aidHandover.receiver_date}
              </p>
              <p>
                <strong>Handover Confirmer Name:</strong>{" "}
                {aidHandover.handover_confirmer_name}
              </p>
              <p>
                <strong>Handover Confirmer Designation:</strong>{" "}
                {aidHandover.handover_confirmer_designation}
              </p>
              <p>
                <strong>Handover Confirmer Date:</strong>{" "}
                {aidHandover.handover_confirmer_date}
              </p>
            </div>
          </div>
        )}

        <div className="form-buttons-sticky">
          {/* Navigation buttons */}
          <div className="navigation-buttons">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep}>
                Back
              </button>
            )}
            {currentStep < totalSteps && (
              <button type="button" onClick={nextStep}>
                Next
              </button>
            )}
            {currentStep === totalSteps && (
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Handover"}
              </button>
            )}
          </div>

          {/* Clear and Refresh button */}
          <div className="button-section-aid_req">
            <button
              type="button"
              className="clsrform"
              onClick={() => clearAndRefresh(["aidHandoverData"])}
            >
              Clear Handover Form
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AidHandoverForm;
