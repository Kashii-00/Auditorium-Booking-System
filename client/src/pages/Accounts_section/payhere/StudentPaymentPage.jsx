import React, { useState } from "react";
import PayHerePaymentButton from "../payhere/PayherePaymentButton";

const StudentPaymentPage = () => {
  const [studentId, setStudentId] = useState("");

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Student Payment Portal</h2>
      <p>Enter your Student ID to proceed with payment.</p>

      <input
        type="number"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        placeholder="Enter Student ID"
        style={{ marginRight: "1rem", padding: "0.5rem" }}
      />

      {studentId && <PayHerePaymentButton studentId={studentId} />}
    </div>
  );
};

export default StudentPaymentPage;
