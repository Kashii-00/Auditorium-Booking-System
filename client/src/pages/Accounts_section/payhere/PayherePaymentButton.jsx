import React, { useEffect, useState } from "react";
import { authRequest } from "../../../services/authService";
import { getApiUrl } from "../../../utils/apiUrl";

const PayHerePaymentButton = ({ studentId }) => {
  const [payhereLoaded, setPayhereLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.payhere.lk/lib/payhere.js"; // Sandbox SDK
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

  const handlePay = async () => {
    if (!payhereLoaded || !window.payhere) {
      alert("Payment service not ready yet. Please wait a moment.");
      return;
    }

    try {
      const paymentData = await authRequest(
        "get",
        getApiUrl(`/api/payhere/initiate/${studentId}`)
      );

      window.payhere.onCompleted = function (orderId) {
        console.log("✅ Payment completed. OrderID:", orderId);
        window.location.href = "/payment-success";
      };

      window.payhere.onDismissed = function () {
        console.log("⚠️ Payment dismissed");
        window.location.href = "/payment-cancel";
      };

      window.payhere.onError = function (error) {
        console.error("❌ Error:", error);
        alert("Payment failed: " + error);
      };

      window.payhere.startPayment(paymentData);
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Failed to start payment. Please try again.");
    }
  };

  return (
    <button
      className="ccfbtn"
      onClick={handlePay}
      disabled={!payhereLoaded}
      style={{ opacity: payhereLoaded ? 1 : 0.5 }}
    >
      {payhereLoaded ? "Pay with PayHere" : "Loading Payment..."}
    </button>
  );
};

export default PayHerePaymentButton;
