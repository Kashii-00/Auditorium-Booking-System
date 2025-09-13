const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const config = require("../../config/app.config");

require("dotenv").config();

const router = express.Router();

// Helper to generate PayHere SDK hash
function generatePayHereHash(
  merchantId,
  orderId,
  amount,
  currency,
  merchantSecret
) {
  const formattedAmount = Number(amount).toFixed(2); // only once
  const innerHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const hashString =
    merchantId + orderId + formattedAmount + currency + innerHash;

  const finalHash = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  return finalHash;
}

// Step 1: Initiate payment
router.get("/initiate/:studentId", (req, res) => {
  const studentId = req.params.studentId;
  const sql = `
    SELECT s.id as student_id, s.name, s.email, p.full_amount_payable
    FROM students_sample s
    JOIN student_payments_sample p ON s.id = p.student_id
    WHERE s.id = ?
  `;

  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!results.length) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = results[0];
    const merchantId = process.env.MERCHANT_ID;
    const merchantSecret = process.env.MERCHANT_SECRET;
    const orderId = "ORDER_" + Date.now();
    const amount = Number(student.full_amount_payable); // no toFixed here
    const currency = "LKR";

    console.log("Using Merchant ID:", merchantId);

    const hash = generatePayHereHash(
      merchantId,
      orderId,
      amount,
      currency,
      merchantSecret
    );

    console.log({
      merchantId,
      orderId,
      amount: amount.toFixed(2),
      currency,
      innerHash: crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase(),
      finalHash: hash,
    });

    // Save order_id for later verification
    const updateOrderSql = `
      UPDATE student_payments_sample 
      SET order_id = ? 
      WHERE student_id = ?
    `;
    db.query(updateOrderSql, [orderId, student.student_id]);

    const paymentData = {
      merchant_id: merchantId,
      return_url: config.payhere.successUrl,
      cancel_url: config.payhere.cancelUrl,
      notify_url: config.serverUrl + "/api/payhere/notify",
      order_id: orderId,
      items: "Course Payment",
      amount: amount.toFixed(2),
      currency: currency,
      first_name: student.name.split(" ")[0],
      last_name: student.name.split(" ")[1] || "",
      email: student.email,
      phone: "0770000000",
      address: "Colombo",
      city: "Colombo",
      country: "Sri Lanka",
      custom_1: student.student_id,
      hash: hash,
    };

    console.log("📤 Sending Payment Data:", paymentData);
    res.json(paymentData);
  });
});

// Step 2: PayHere notify callback
router.post("/notify", (req, res) => {
  const {
    status_code,
    custom_1: studentId,
    payment_id,
    payhere_amount,
    order_id,
  } = req.body;

  if (status_code === "2") {
    const sql = `
      UPDATE student_payments_sample
      SET payment_completed = TRUE,
          amount_paid = ?,
          transaction_id = ?,
          payment_date = NOW()
      WHERE student_id = ? AND order_id = ?
    `;

    db.query(sql, [payhere_amount, payment_id, studentId, order_id], (err) => {
      if (err) {
        console.error("DB update error:", err);
        return res.status(500).send("DB update failed");
      }
      console.log("✅ Payment successful for student:", studentId);
      res.sendStatus(200);
    });
  } else {
    console.log("❌ Payment not successful. Status code:", status_code);
    res.sendStatus(200);
  }
});

module.exports = router;
