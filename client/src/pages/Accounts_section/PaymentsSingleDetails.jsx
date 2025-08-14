import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import "./styles/styles.css";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  groupedCourseOptions,
  courseToStreamMap,
} from "../Classroom_Booking/aidUtils";

const PaymentSingleDetails = () => {
  const location = useLocation();
  const paymentMainDetailsId = location.state?.payment;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const successTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const navigate = useNavigate();

  const [deletingLabel, setDeletingLabel] = useState(null);

  const [refreshingSummary, setRefreshingSummary] = useState(false);

  const contentRef = useRef(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  const [summaryNeedsRefresh, setSummaryNeedsRefresh] = useState(null);

  const [summaryFlags, setSummaryFlags] = useState(null);

  useEffect(() => {
    const fetchReminderFlag = async () => {
      if (data?.payments_main_details?.id) {
        const needsRefresh = await shouldShowSummaryReminder(
          data.payments_main_details.id
        );
        setSummaryNeedsRefresh(needsRefresh);
      }
    };

    fetchReminderFlag();
  }, [data?.payments_main_details?.id]);

  useEffect(() => {
    const fetchFlags = async () => {
      if (data?.payments_main_details?.id) {
        const flags = await fetchSummaryFlags(data.payments_main_details.id);
        setSummaryFlags(flags);
      }
    };

    fetchFlags();
  }, [data?.payments_main_details?.id]);

  const isSpecialFlagCondition = (flags) => {
    const toBool = (val) => val === true || val === 1 || val === "1";
    const isFalse = (val) => !toBool(val);

    return (
      toBool(flags?.summary_needs_refresh) && // ✅ changed
      isFalse(flags?.summary_up_to_date) && // ✅ changed
      isFalse(flags?.special_cp_up_to_date)
    );
  };

  const ensureCostSummaryFlagExists = async (paymentId) => {
    try {
      await authRequest(
        "get",
        getApiUrl(`/api/cost-summary-flags/${paymentId}`)
      );
      // Exists, no action needed
    } catch (err) {
      if (err.response?.status === 404) {
        // Not found — create it
        await authRequest(
          "post",
          getApiUrl("/api/cost-summary-flags"),
          {
            payments_main_details_id: paymentId,
            summary_needs_refresh: false,
            summary_up_to_date: false,
            special_cp_up_to_date: false,
          }
        );
      } else {
        console.error("Error checking flag existence:", err);
        throw err;
      }
    }
  };

  const markSummaryNeedsRefresh = async (paymentId) => {
    if (!paymentId) return;
    try {
      await ensureCostSummaryFlagExists(paymentId);
      await authRequest(
        "patch",
        getApiUrl(`/api/cost-summary-flags/${paymentId}`),
        {
          summary_needs_refresh: true,
          summary_up_to_date: false,
          special_cp_up_to_date: false,
        }
      );
      const flags = await fetchSummaryFlags(paymentId);
      setSummaryFlags(flags);
    } catch (err) {
      console.error("Error marking summary needs refresh:", err);
    }
  };

  const clearSummaryNeedsRefresh = async (paymentId) => {
    if (!paymentId) return;
    try {
      await ensureCostSummaryFlagExists(paymentId);
      await authRequest(
        "patch",
        getApiUrl(`/api/cost-summary-flags/${paymentId}`),
        {
          summary_needs_refresh: false,
          summary_up_to_date: true,
          special_cp_up_to_date: true,
        }
      );
      const flags = await fetchSummaryFlags(paymentId);
      setSummaryFlags(flags);
    } catch (err) {
      console.error("Error clearing summary refresh flag:", err);
    }
  };

  const clearSpecialCaseFlag = async (paymentId) => {
    if (!paymentId) return;
    try {
      await ensureCostSummaryFlagExists(paymentId);
      await authRequest(
        "patch",
        getApiUrl(`/api/cost-summary-flags/${paymentId}`),
        {
          summary_needs_refresh: true,
          summary_up_to_date: false,
          special_cp_up_to_date: true,
        }
      );
      const flags = await fetchSummaryFlags(paymentId);
      setSummaryFlags(flags);
    } catch (err) {
      console.error("Error marking summary needs refresh:", err);
    }
  };

  const shouldShowSummaryReminder = async (paymentId) => {
    if (!paymentId) return false;
    try {
      const response = await authRequest(
        "get",
        getApiUrl(`/api/cost-summary-flags/${paymentId}`)
      );

      // Fix: converts 0 or 1 to true/false properly
      return !!response?.summary_needs_refresh;
    } catch (err) {
      console.error("Error fetching summary reminder:", err);
      return false;
    }
  };

  const fetchSummaryFlags = async (paymentId) => {
    if (!paymentId) return null;
    try {
      const response = await authRequest(
        "get",
        getApiUrl(`/api/cost-summary-flags/${paymentId}`)
      );
      // Assuming response is an object with summary_needs_refresh, summary_up_to_date, special_cp_up_to_date
      return response;
    } catch (err) {
      console.error("Error fetching summary flags:", err);
      return null;
    }
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: state.isFocused ? "#01eeff" : "#00a6ff9d",
      borderWidth: 3,
      borderRadius: 4,
      minHeight: 32,
      boxShadow: "none",
      fontSize: "12px",
      "&:hover": { borderColor: "#01eeff" },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 6px",
      fontSize: "12px",
    }),
    placeholder: (base) => ({ ...base, color: "#999", fontSize: "12px" }),
    input: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
    singleValue: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#003b5a",
      color: "#e3eaf5",
      fontSize: "10px",
      borderRadius: 4,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#01eeff" : "transparent",
      color: state.isFocused ? "#000" : "#e3eaf5",
      fontSize: "12px",
      padding: "6px 10px",
    }),
  };

  const normalizeRoles = (rawRole) => {
    if (!rawRole) return [];

    if (Array.isArray(rawRole)) {
      if (
        rawRole.length === 1 &&
        typeof rawRole[0] === "string" &&
        rawRole[0].startsWith("[") &&
        rawRole[0].endsWith("]")
      ) {
        try {
          return JSON.parse(rawRole[0]);
        } catch {
          return rawRole;
        }
      }
      return rawRole;
    }

    if (typeof rawRole === "string") {
      if (rawRole.startsWith("[") && rawRole.endsWith("]")) {
        try {
          return JSON.parse(rawRole);
        } catch {
          return [rawRole];
        }
      }
      return [rawRole];
    }

    return [];
  };

  const hasRole = (targetRole) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const roles = normalizeRoles(user?.role);
    return roles.includes(targetRole);
  };

  // define fetchData with useCallback, so it's stable and updates if paymentMainDetailsId changes
  const fetchData = useCallback(async () => {
    if (!paymentMainDetailsId) {
      setError("No payment ID provided.");
      return;
    }
    try {
      const res = await authRequest(
        "get",
        getApiUrl(`/api/payment-sf-display/${paymentMainDetailsId}`)
      );
      console.log("Payment details fetched:", res);
      setData(res);
      setSuccessMessage("Payment details loaded successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch payment details.");
    }
  }, [paymentMainDetailsId]);

  // call fetchData on component mount / paymentMainDetailsId change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (successMessage) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
    }
  }, [error]);

  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState");
      if (stored !== null) {
        const isCollapsed = stored === "true";
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", { detail: { isCollapsed } })
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

  const renderTable = (title, rows, columns) => (
    <>
      <h3>{title}</h3>
      {rows && rows.length > 0 ? (
        <div className="table-wrapper">
          <table className="styled-table">
            {/* 🆕 Equal-width columns using colgroup */}
            <colgroup>
              {columns.map((_, index) => (
                <col
                  key={index}
                  style={{ width: `${100 / columns.length}%` }}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-table-msg">No data available for {title}</p>
      )}
    </>
  );

  const handleDelete = async (url, label) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${label}? This cannot be undone.`
      )
    )
      return;

    setDeletingLabel(label);

    // Optimistic UI update
    setData((prevData) => {
      if (!prevData) return prevData;

      const updated = { ...prevData };

      if (label === "Course Cost Summary") {
        updated.course_cost_summary = null;
      } else if (label === "Course Development Work") {
        updated.course_development_work = null;
      } else if (label === "Course Delivery Costs") {
        updated.course_delivery_costs = null;
      } else if (label === "Course Overheads") {
        updated.course_overheads_main = null;
      }

      return updated;
    });

    try {
      // 🔁 Delete the record
      await authRequest("delete", url);

      setSuccessMessage(`${label} deleted successfully.`);

      // ✅ Trigger reminder
      await markSummaryNeedsRefresh(data.payments_main_details.id);
      setSummaryNeedsRefresh(false);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to delete ${label}`);
    } finally {
      setTimeout(() => {
        fetchData();
        setDeletingLabel(null);
      }, 1000);
    }
  };

  // const handleRefreshSummary = async () => {
  //   if (!data?.course_cost_summary?.id || !data?.payments_main_details?.id) {
  //     setError("Missing summary or payment ID.");
  //     return;
  //   }

  //   if (!window.confirm("Recalculate the course cost summary now?")) return;

  //   setRefreshingSummary(true);

  //   try {
  //     // Step 1: Delete existing summary
  //     await authRequest(
  //       "delete",
  //       `http://localhost:5003/api/payment-course-final-summary/${data.course_cost_summary.id}`
  //     );

  //     // Step 2: Create new summary
  //     const currentUser = JSON.parse(localStorage.getItem("user"));
  //     const userEmail = currentUser?.email || "System";

  //     const postData = {
  //       payment_main_details_id: data.payments_main_details.id,
  //       check_by: userEmail,
  //     };

  //     await authRequest(
  //       "post",
  //       "http://localhost:5003/api/payment-course-final-summary",
  //       postData
  //     );

  //     setSuccessMessage("Summary recalculated successfully.");
  //     fetchData();
  //     await clearSummaryNeedsRefresh(data.payments_main_details.id);
  //     setSummaryNeedsRefresh(false);
  //   } catch (err) {
  //     setError(
  //       err.response?.data?.error || "Failed to recalculate cost summary."
  //     );
  //   } finally {
  //     setRefreshingSummary(false);
  //   }
  // };

  const handleRefreshSummary = async () => {
    if (!data?.course_cost_summary?.id || !data?.payments_main_details?.id) {
      setError("Missing summary or payment ID.");
      return;
    }

    if (!window.confirm("Recalculate the course cost summary now?")) return;

    setRefreshingSummary(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const userEmail = currentUser?.email || "System";

      const postData = {
        payment_main_details_id: data.payments_main_details.id,
        check_by: userEmail,
      };

      // Just call POST, no need to call DELETE separately
      await authRequest(
        "post",
        getApiUrl("/api/payment-course-final-summary"),
        postData
      );

      setSuccessMessage("Summary recalculated successfully.");
      fetchData();
      await clearSummaryNeedsRefresh(data.payments_main_details.id);
      setSummaryNeedsRefresh(false);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to recalculate cost summary."
      );
    } finally {
      setRefreshingSummary(false);
    }
  };

  // const handleUpdateSpecialCasePayments = async () => {
  //   if (
  //     !window.confirm(
  //       "This will let you re-enter Special Case Payments. Continue?"
  //     )
  //   )
  //     return;

  //   // Step 1: Save draft to localStorage
  //   const draft = {
  //     payments_main_details_id: data.payments_main_details.id,
  //     entries: data.special_case_payments.map((payment) => ({
  //       sc_title: payment.sc_title,
  //       description: payment.description,
  //       percent_payment_or_not: payment.percent_payment_or_not,
  //       percentage: payment.percent_payment_or_not
  //         ? payment.percentage || 0
  //         : null,
  //       total_payable: !payment.percent_payment_or_not
  //         ? payment.total_payable || 0
  //         : null,
  //     })),
  //   };

  //   localStorage.setItem("special_case_payment_draft", JSON.stringify(draft));

  //   try {
  //     // Step 2: marking to remind to recalculate
  //     await clearSpecialCaseFlag(data.payments_main_details.id);
  //     setSummaryNeedsRefresh(true);

  //     alert("Draft saved. You can now re-enter Special Case Payments.");

  //     // Step 3: Navigate to step 4
  //     navigate("/coursecost", { state: { step: 5 } });
  //   } catch (err) {
  //     alert(
  //       err?.response?.data?.error ||
  //         "Failed to delete special case payment data. Try again."
  //     );
  //   }
  // };

  const handleDeleteAllSpecialCasePayments = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all special case payments? This cannot be undone."
      )
    )
      return;

    try {
      await authRequest(
        "delete",
        getApiUrl(`/api/special-case-payments/by-payment/${data.payments_main_details.id}`)
      );

      setSuccessMessage("All special case payments deleted.");
      await clearSpecialCaseFlag(data.payments_main_details.id);
      setSummaryNeedsRefresh(true);
      fetchData();
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to delete special case payments."
      );
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = `Estimated Cost Sheet - ${
      data?.payments_main_details?.course_name || "Course"
    }`;

    doc.setFontSize(16);
    doc.text(title, 14, 20);

    let currentY = 30;

    const addSection = (label) => {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(label, 14, currentY);
      currentY += 8;
      doc.setFont("helvetica", "normal");
    };

    const addTable = (headers, rows) => {
      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: rows,
        theme: "grid",
        margin: { left: 14, right: 14 },
        styles: { fontSize: 10 },
      });
      currentY = doc.lastAutoTable.finalY + 12;
    };

    const formatCurrency = (val) =>
      val !== null && val !== undefined
        ? `Rs.${Number(val).toLocaleString()}`
        : "N/A";

    const yesNo = (val) => (val ? "Approved" : "Not Approved");

    // --- Course Details ---
    addSection("Course Details");
    addTable(
      ["Field", "Value"],
      [
        ["Costing Sheet ID", data.payments_main_details.id],
        // ["Course ID", data.payments_main_details.course_id],
        // ["Batch ID", data.payments_main_details.batch_id],
        ["Course Name", data.payments_main_details.course_name],
        ["Participants", data.payments_main_details.no_of_participants],
        ["Duration", data.payments_main_details.duration],
        ["Customer Type", data.payments_main_details.customer_type],
        ["Stream", data.payments_main_details.stream],
      ]
    );

    // --- Course Development Work ---
    if (data.course_development_work?.main) {
      addSection("Course Development Work - Summary");
      addTable(
        ["Total Cost (A)"],
        [[formatCurrency(data.course_development_work.main.total_cost)]]
      );

      if (data.course_development_work?.development_work_expenses?.length) {
        addSection("Development Expenses");
        addTable(
          ["Description", "Quantity", "Rate", "Amount"],
          data.course_development_work.development_work_expenses.map((e) => [
            e.item_description,
            e.required_quantity,
            formatCurrency(e.rate),
            formatCurrency(e.amount),
          ])
        );
      }

      if (data.course_development_work?.panel_meeting_participants?.length) {
        addSection("Panel Participants");
        addTable(
          ["Type", "Nos", "SMEs", "Rate/hour", "Amount"],
          data.course_development_work.panel_meeting_participants.map((p) => [
            p.participant_type,
            p.nos,
            p.smes,
            formatCurrency(p.rate_per_hour),
            formatCurrency(p.amount),
          ])
        );
      }
    }

    // --- Course Delivery Costs ---
    if (data.course_delivery_costs?.main) {
      addSection("Course Delivery Costs - Summary");
      addTable(
        ["Total Cost (B)"],
        [[formatCurrency(data.course_delivery_costs.main.total_cost)]]
      );

      if (data.course_delivery_costs?.cost_items?.length) {
        addSection("HR Cost Items");
        addTable(
          ["Role", "No of Officers", "Hours", "Rate", "Amount"],
          data.course_delivery_costs.cost_items.map((i) => [
            i.role,
            i.no_of_officers,
            i.hours,
            formatCurrency(i.rate),
            formatCurrency(i.amount),
          ])
        );
      }

      if (data.course_delivery_costs?.materials?.length) {
        addSection("Materials");
        addTable(
          ["Description", "Quantity", "Rate", "Cost"],
          data.course_delivery_costs.materials.map((m) => [
            m.item_description,
            m.required_quantity,
            formatCurrency(m.rate),
            formatCurrency(m.cost),
          ])
        );
      }
    }

    // --- Special Case Payments ---
    if (data.special_case_payments?.length > 0) {
      addSection("Special Case Payments");
      addTable(
        ["Title", "Description", "Payment Type", "Total Payable"],
        data.special_case_payments.map((item) => [
          item.sc_title,
          item.description,
          item.percent_payment_or_not === 1 && item.percentage !== null
            ? `${item.percentage}% of Total Revenue`
            : "Full Payment Requested",
          formatCurrency(item.total_payable),
        ])
      );
    }

    // --- Overheads ---
    if (data.course_overheads_main?.main) {
      addSection("Overheads - Summary");
      addTable(
        ["Total Cost (C)"],
        [[formatCurrency(data.course_overheads_main.main.total_cost)]]
      );

      if (data.course_overheads_main?.teaching_aids?.length) {
        addSection("Teaching Aids");
        addTable(
          ["Description", "Quantity", "Hours", "Rate", "Cost"],
          data.course_overheads_main.teaching_aids.map((aid) => [
            aid.item_description,
            aid.required_quantity,
            aid.required_hours,
            formatCurrency(aid.hourly_rate),
            formatCurrency(aid.cost),
          ])
        );
      }

      if (data.course_overheads_main?.training_environments?.length) {
        addSection("Training Environments");
        addTable(
          ["Description", "Hours", "Rate", "Cost"],
          data.course_overheads_main.training_environments.map((env) => [
            env.item_description,
            env.required_hours,
            formatCurrency(env.hourly_rate),
            formatCurrency(env.cost),
          ])
        );
      }

      if (data.course_overheads_main?.overheads?.length) {
        addSection("Overhead Items");
        addTable(
          ["Description", "Quantity", "Rate", "Cost"],
          data.course_overheads_main.overheads.map((oh) => [
            oh.item_description,
            oh.required_quantity,
            formatCurrency(oh.rate),
            formatCurrency(oh.cost),
          ])
        );
      }
    }

    // --- Calculation Sheet ---
    if (data.course_cost_summary) {
      addSection("Calculation Sheet");
      addTable(
        ["Formula", "Value"],
        [
          [
            "Total Estimated Cost (A + B + C)",
            formatCurrency(data.course_cost_summary.total_cost_expense),
          ],
          [
            `+ Inflation (${data.course_cost_summary.provision_inflation_percentage}%)`,
            formatCurrency(data.course_cost_summary.inflation_amount),
          ],
          [
            `+ NBT (${data.course_cost_summary.NBT_percentage}%)`,
            formatCurrency(data.course_cost_summary.NBT),
          ],
          [
            `+ Profit Margin (${data.course_cost_summary.profit_margin_percentage}%)`,
            formatCurrency(data.course_cost_summary.profit_margin),
          ],
          [
            `+ VAT (${data.course_cost_summary.VAT_percentage}%)`,
            formatCurrency(data.course_cost_summary.VAT),
          ],
          ["", ""],
          [
            "Total Course Cost",
            formatCurrency(data.course_cost_summary.total_course_cost),
          ],
          ["No. of Participants", data.course_cost_summary.no_of_participants],
          [
            "Course Fee Per Head = Total Course Cost ÷ No. of Participants",
            formatCurrency(data.course_cost_summary.course_fee_per_head),
          ],
          [
            "Rounded Course Fee Per Head",
            formatCurrency(data.course_cost_summary.Rounded_CFPH),
          ],
          [
            "Total Course Fee Revenue = Rounded Course Fee Per Head × No. of Participants",
            formatCurrency(data.course_cost_summary.Rounded_CT),
          ],
        ]
      );

      // --- Approvals ---
      addSection("Approvals & Justifications");
      addTable(
        ["Field", "Value"],
        [
          ["Prepared By", data.course_cost_summary.prepared_by || "N/A"],
          ["Checked By", data.course_cost_summary.check_by || "Not Checked"],
          [
            "Special Justifications",
            data.payments_main_details.special_justifications || "Not Provided",
          ],
          [
            "Accountant Approval",
            yesNo(data.payments_main_details.accountant_approval_obtained),
          ],
          [
            "Accountant Details",
            data.payments_main_details.accountant_details || "N/A",
          ],
          [
            "Sectional Approval",
            yesNo(data.payments_main_details.sectional_approval_obtained),
          ],
          ["Section Type", data.payments_main_details.section_type || "N/A"],
          [
            "Sectional Details",
            data.payments_main_details.sectional_details || "N/A",
          ],
          [
            "DCTM01 Approval",
            yesNo(data.payments_main_details.DCTM01_approval_obtained),
          ],
          [
            "DCTM01 Details",
            data.payments_main_details.DCTM01_details || "N/A",
          ],
          [
            "DCTM02 Approval",
            yesNo(data.payments_main_details.DCTM02_approval_obtained),
          ],
          [
            "DCTM02 Details",
            data.payments_main_details.DCTM02_details || "N/A",
          ],
          ["CTM Approved", yesNo(data.payments_main_details.CTM_approved)],
          ["CTM Details", data.payments_main_details.CTM_details || "N/A"],
        ]
      );
    }

    // Save the file
    doc.save(
      `Estimated_Cost_Sheet_${data.payments_main_details.course_name}.pdf`
    );
  };

  const handleDownloadCSV = () => {
    if (!data) return;
    const rows = [];
    rows.push(["Costing Sheet ID", data.payments_main_details.id]);
    // rows.push(["Course ID", data.payments_main_details.course_id]);
    // rows.push(["Batch ID", data.payments_main_details.batch_id]);
    rows.push(["Course Name", data.payments_main_details.course_name]);
    rows.push([
      "No. of Participants",
      data.payments_main_details.no_of_participants,
    ]);
    rows.push(["Duration", data.payments_main_details.duration]);
    rows.push(["Customer Type", data.payments_main_details.customer_type]);
    rows.push(["Stream", data.payments_main_details.stream]);
    rows.push([""]);

    // Course Development Work
    if (data.course_development_work?.main) {
      rows.push(["Course Development Work"]);
      rows.push([
        "Total Cost (A)",
        data.course_development_work.main.total_cost,
      ]);
      rows.push([""]);

      if (data.course_development_work?.development_work_expenses?.length) {
        rows.push(["Development Expenses"]);
        rows.push(["Description", "Quantity", "Rate", "Amount"]);
        data.course_development_work.development_work_expenses.forEach((e) =>
          rows.push([e.item_description, e.required_quantity, e.rate, e.amount])
        );
        rows.push([""]);
      }

      if (data.course_development_work?.panel_meeting_participants?.length) {
        rows.push(["Panel Participants"]);
        rows.push(["Type", "Nos", "SMEs", "Rate/hour", "Amount"]);
        data.course_development_work.panel_meeting_participants.forEach((p) =>
          rows.push([
            p.participant_type,
            p.nos,
            p.smes,
            p.rate_per_hour,
            p.amount,
          ])
        );
        rows.push([""]);
      }
    }

    // Course Delivery Costs
    if (data.course_delivery_costs?.main) {
      rows.push(["Delivery Costs"]);
      rows.push(["Total Cost (B)", data.course_delivery_costs.main.total_cost]);
      rows.push([""]);

      if (data.course_delivery_costs?.cost_items?.length) {
        rows.push(["HR Cost Items"]);
        rows.push(["Role", "No of Officers", "Hours", "Rate", "Amount"]);
        data.course_delivery_costs.cost_items.forEach((item) =>
          rows.push([
            item.role,
            item.no_of_officers,
            item.hours,
            item.rate,
            item.amount,
          ])
        );
        rows.push([""]);
      }

      if (data.course_delivery_costs?.materials?.length) {
        rows.push(["Materials"]);
        rows.push(["Description", "Quantity", "Rate", "Cost"]);
        data.course_delivery_costs.materials.forEach((m) =>
          rows.push([m.item_description, m.required_quantity, m.rate, m.cost])
        );
        rows.push([""]);
      }
    }

    // Special Case Payments
    if (data.special_case_payments?.length > 0) {
      rows.push(["Special Case Payments"]);
      rows.push(["Title", "Description", "Payment Type", "Total Payable"]);
      data.special_case_payments.forEach((item) =>
        rows.push([
          item.sc_title,
          item.description,
          item.percent_payment_or_not === 1 && item.percentage !== null
            ? `${item.percentage}% of Total Revenue`
            : "Full Payment Requested",
          item.total_payable,
        ])
      );
      rows.push([""]);
    }

    // Course Overheads
    if (data.course_overheads_main?.main) {
      rows.push(["Overheads"]);
      rows.push(["Total Cost (C)", data.course_overheads_main.main.total_cost]);
      rows.push([""]);

      if (data.course_overheads_main?.teaching_aids?.length) {
        rows.push(["Teaching Aids"]);
        rows.push(["Description", "Quantity", "Hours", "Rate", "Cost"]);
        data.course_overheads_main.teaching_aids.forEach((aid) =>
          rows.push([
            aid.item_description,
            aid.required_quantity,
            aid.required_hours,
            aid.hourly_rate,
            aid.cost,
          ])
        );
        rows.push([""]);
      }

      if (data.course_overheads_main?.training_environments?.length) {
        rows.push(["Training Environments"]);
        rows.push(["Description", "Hours", "Rate", "Cost"]);
        data.course_overheads_main.training_environments.forEach((env) =>
          rows.push([
            env.item_description,
            env.required_hours,
            env.hourly_rate,
            env.cost,
          ])
        );
        rows.push([""]);
      }

      if (data.course_overheads_main?.overheads?.length) {
        rows.push(["Overheads"]);
        rows.push(["Description", "Quantity", "Rate", "Cost"]);
        data.course_overheads_main.overheads.forEach((oh) =>
          rows.push([
            oh.item_description,
            oh.required_quantity,
            oh.rate,
            oh.cost,
          ])
        );
        rows.push([""]);
      }
    }

    // --- CALCULATION SHEET ---
    if (data.course_cost_summary) {
      rows.push([""]);
      rows.push(["Calculation Sheet"]);
      rows.push(["Formula", "Value"]);

      rows.push([
        "Total Estimated Cost (A + B + C)",
        `Rs.${data.course_cost_summary.total_cost_expense}`,
      ]);
      rows.push([
        `+ Inflation (${data.course_cost_summary.provision_inflation_percentage}%)`,
        `Rs.${data.course_cost_summary.inflation_amount}`,
      ]);
      rows.push([
        `+ NBT (${data.course_cost_summary.NBT_percentage}%)`,
        `Rs.${data.course_cost_summary.NBT}`,
      ]);
      rows.push([
        `+ Profit Margin (${data.course_cost_summary.profit_margin_percentage}%)`,
        `Rs.${data.course_cost_summary.profit_margin}`,
      ]);
      rows.push([
        `+ VAT (${data.course_cost_summary.VAT_percentage}%)`,
        `Rs.${data.course_cost_summary.VAT}`,
      ]);

      rows.push(["", ""]);
      rows.push([
        "Total Course Cost",
        `Rs.${data.course_cost_summary.total_course_cost}`,
      ]);
      rows.push([
        "No. of  participant",
        data.course_cost_summary.no_of_participants,
      ]);
      rows.push([
        `Course Fee Per Head = Total Course Cost ÷ No. of Participants`,
        `Rs.${data.course_cost_summary.course_fee_per_head}`,
      ]);
      rows.push([
        `Rounded Course Fee Per Head`,
        `Rs.${data.course_cost_summary.Rounded_CFPH}`,
      ]);
      rows.push([
        `Total Course Fee Revenue = Rounded Fee × No. of Participants`,
        `Rs.${data.course_cost_summary.Rounded_CT}`,
      ]);

      // --- APPROVALS ---
      rows.push([""]);
      rows.push(["Prepared By", data.course_cost_summary.prepared_by]);
      rows.push(["Checked By", data.course_cost_summary.check_by]);
      rows.push([
        "Special Justifications",
        data.payments_main_details.special_justifications,
      ]);
      rows.push([
        "Accountant Approval Obtained",
        data.payments_main_details.accountant_approval_obtained,
      ]);
      rows.push([
        "Accountant Details",
        data.payments_main_details.accountant_details,
      ]);
      rows.push([
        "Sectional Approval Obtained",
        data.payments_main_details.sectional_approval_obtained,
      ]);
      rows.push(["Section Type", data.payments_main_details.section_type]);
      rows.push([
        "Sectional Details",
        data.payments_main_details.sectional_details,
      ]);
      rows.push([
        "DCTM01 Approval Obtained",
        data.payments_main_details.DCTM01_approval_obtained,
      ]);
      rows.push(["DCTM01 Details", data.payments_main_details.DCTM01_details]);
      rows.push([
        "DCTM02 Approval Obtained",
        data.payments_main_details.DCTM02_approval_obtained,
      ]);
      rows.push(["DCTM02 Details", data.payments_main_details.DCTM02_details]);
      rows.push([
        "CTM Approved Status",
        data.payments_main_details.CTM_approved,
      ]);
      rows.push(["CTM Details", data.payments_main_details.CTM_details]);
    }

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `Estimated_Cost_Sheet_${data.payments_main_details.course_name}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEditableFields = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const roles = normalizeRoles(user?.role || []);
    const userId = user?.id;
    const isRecordOwner = data?.payments_main_details?.user_id === userId;

    const FIELD_PERMISSIONS = {
      SuperAdmin: ["*"],
      finance_manager: [
        "accountant_approval_obtained",
        "accountant_details",
        "course_name",
        "customer_type",
        "stream",
        "date",
        "special_justifications",
        "no_of_participants",
        "duration",
      ],
      user: ["special_justifications", "no_of_participants", "duration"],
      CTM: [
        "CTM_approved",
        "CTM_details",
        "course_name",
        "customer_type",
        "stream",
        "date",
        "special_justifications",
        "no_of_participants",
        "duration",
      ],
      DCTM01: [
        "DCTM01_approval_obtained",
        "DCTM01_details",
        "course_name",
        "customer_type",
        "stream",
        "date",
        "special_justifications",
        "no_of_participants",
        "duration",
      ],
      DCTM02: [
        "DCTM02_approval_obtained",
        "DCTM02_details",
        "course_name",
        "customer_type",
        "stream",
        "date",
        "special_justifications",
        "no_of_participants",
        "duration",
      ],
      sectional_head: [
        "sectional_approval_obtained",
        "section_type",
        "sectional_details",
        "course_name",
        "customer_type",
        "stream",
        "date",
        "special_justifications",
        "no_of_participants",
        "duration",
      ],
    };

    // SuperAdmin override
    if (roles.some((r) => FIELD_PERMISSIONS[r]?.includes("*"))) {
      return [
        "course_name",
        "customer_type",
        "stream",
        "date",
        "special_justifications",
        "no_of_participants",
        "duration",
        "accountant_approval_obtained",
        "accountant_details",
        "sectional_approval_obtained",
        "section_type",
        "sectional_details",
        "DCTM01_approval_obtained",
        "DCTM01_details",
        "DCTM02_approval_obtained",
        "DCTM02_details",
        "CTM_approved",
        "CTM_details",
      ];
    }

    const allowed = new Set();
    roles.forEach((r) => {
      const fields = FIELD_PERMISSIONS[r];
      if (fields) fields.forEach((f) => allowed.add(f));
    });

    if (isRecordOwner) {
      allowed.add("course_name");
      allowed.add("customer_type");
      allowed.add("stream");
      allowed.add("date");
      allowed.add("special_justifications");
      allowed.add("no_of_participants");
      allowed.add("duration");
    }

    return [...allowed];
  };

  const validateEditForm = () => {
    const errors = {};
    const editableFields = getEditableFields();

    editableFields.forEach((field) => {
      const value = editForm[field];

      if (field === "no_of_participants") {
        if (value === "") {
          errors[field] = "This field is required.";
        } else if (isNaN(Number(value)) || Number(value) < 0) {
          errors[field] = "Must be a non-negative number.";
        }
      }

      if (field === "duration") {
        if (!value || value.trim() === "") {
          errors[field] = "Duration cannot be empty.";
        }
      }

      if (field === "course_name") {
        if (!value || value.trim() === "") {
          errors[field] = "Course name is required.";
        }
      }

      if (field === "customer_type") {
        const validCustomerTypes = ["Internal", "External", "Mixed"];
        if (!value) {
          errors[field] = "Customer type is required.";
        } else if (!validCustomerTypes.includes(value)) {
          errors[field] = "Invalid customer type.";
        }
      }

      if (field === "stream") {
        if (!value || value.trim() === "") {
          errors[field] = "Stream is required.";
        }
      }

      if (field === "date") {
        if (!value) {
          errors[field] = "Date is required.";
        } else {
          const dateObj = new Date(value);
          if (isNaN(dateObj.getTime())) {
            errors[field] = "Invalid date.";
          }
        }
      }

      const textLimitFields = [
        "CTM_details",
        "special_justifications",
        "accountant_details",
        "sectional_details",
        "DCTM01_details",
        "DCTM02_details",
      ];
      if (textLimitFields.includes(field)) {
        if (value && value.length > 500) {
          errors[field] = "Maximum 500 characters allowed.";
        }
      }

      const selectFields = [
        "CTM_approved",
        "accountant_approval_obtained",
        "sectional_approval_obtained",
        "section_type",
        "DCTM01_approval_obtained",
        "DCTM02_approval_obtained",
      ];
      if (selectFields.includes(field)) {
        let validOptions;
        if (field === "section_type") {
          validOptions = [
            "Management Stream",
            "Information System",
            "Fire Safety & Occupational Health",
            "Port Operation & Logistics",
            "Technical",
            "Maritime & Seamenship",
          ];
          // Allow null or empty string for section_type without error
          if (value === null || value === undefined || value === "") {
            // Skip validation error
            return; // skips to next field in forEach
          }
        } else {
          validOptions = ["Pending", "Approved", "Rejected"];
        }

        if (value && !validOptions.includes(value)) {
          errors[field] = "Invalid selection.";
        }
      }
    });

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isOwner = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;
    return data?.payments_main_details?.user_id === userId;
  };

  return (
    <div
      className={`content-wrapper ${
        sidebarCollapsed ? "expanded" : ""
      } form-wp2`}
    >
      {successMessage && (
        <div className="success-popup2" role="alert" aria-live="assertive">
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div className="error-popup2" role="alert" aria-live="assertive">
          ❌ {error}
        </div>
      )}
      <div className="mainCostCon">
        <div ref={contentRef} className="review2Con">
          <div className="form-buttons-sticky">
            <div className="navigation-buttons">
              <button
                onClick={handleDownloadPDF}
                className="ccfbtn"
                style={{ marginBottom: "10px" }}
              >
                📄 Download PDF
              </button>
              <button
                onClick={handleDownloadCSV}
                className="ccfbtn"
                style={{ marginBottom: "10px" }}
              >
                🧾 Download CSV
              </button>
            </div>
          </div>
          {data && (
            <>
              <h2 className="page-description-type2 h2-type2">
                ESTIMATED COST SHEET
              </h2>
              <section>
                <p>
                  <strong>Name of the Course: </strong>
                  {data.payments_main_details.course_name}
                </p>
                <p>
                  <strong>No of Participants: </strong>
                  {data.payments_main_details.no_of_participants}
                </p>
                <p>
                  <strong>Duration: </strong>
                  {data.payments_main_details.duration}
                </p>
                <p>
                  <strong>Customer: </strong>
                  {data.payments_main_details.customer_type}
                </p>
                <p>
                  <strong>Stream: </strong> {data.payments_main_details.stream}
                </p>
                <div className="pfbtns print-hidden">
                  <button
                    onClick={() => {
                      setEditForm({
                        CTM_approved:
                          data.payments_main_details.CTM_approved || "Pending",
                        CTM_details:
                          data.payments_main_details.CTM_details || "",
                        special_justifications:
                          data.payments_main_details.special_justifications ||
                          "",
                        no_of_participants:
                          data.payments_main_details.no_of_participants || "",
                        duration: data.payments_main_details.duration || "",

                        // 🆕 New fields
                        accountant_approval_obtained:
                          data.payments_main_details
                            .accountant_approval_obtained || "Pending",
                        accountant_details:
                          data.payments_main_details.accountant_details || "",
                        sectional_approval_obtained:
                          data.payments_main_details
                            .sectional_approval_obtained || "Pending",

                        section_type:
                          data.payments_main_details.section_type ?? "",
                        sectional_details:
                          data.payments_main_details.sectional_details || "",
                        DCTM01_approval_obtained:
                          data.payments_main_details.DCTM01_approval_obtained ||
                          "Pending",
                        DCTM01_details:
                          data.payments_main_details.DCTM01_details || "",
                        DCTM02_approval_obtained:
                          data.payments_main_details.DCTM02_approval_obtained ||
                          "Pending",
                        DCTM02_details:
                          data.payments_main_details.DCTM02_details || "",

                        // 🆕 New fields
                        course_name:
                          data.payments_main_details.course_name || "",
                        customer_type:
                          data.payments_main_details.customer_type || "",
                        stream: data.payments_main_details.stream || "",
                        date: data.payments_main_details.date || "",
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="recalc-btn"
                  >
                    📝 Edit Payment Info
                  </button>
                </div>
              </section>
              {/* Course Development Work */}
              <section>
                {data.course_development_work &&
                data.course_development_work.main ? (
                  <>
                    <h2>Course Development Work</h2>
                    <p className="cost-line">
                      Cost for Course Development - A:
                      <span className="amount-value">
                        Rs.{data.course_development_work.main.total_cost}
                      </span>
                    </p>
                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            getApiUrl(`/api/course-development-work/full/${data.course_development_work.main.id}`),
                            "Course Development Work"
                          )
                        }
                        className="delete-btn3"
                        disabled={deletingLabel === "Course Development Work"}
                      >
                        🗑 Delete Course Development Work
                      </button>

                      {data.course_development_work?.main && (
                        <button
                          className="recalc-btn"
                          // disabled={!isOwner()}
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "This will let you re-enter Course Development Work. Continue?"
                              )
                            )
                              return;

                            const dev = data.course_development_work;

                            // Step 1: Save draft to localStorage
                            const draft = {
                              payments_main_details_id:
                                data.payments_main_details.id,
                              no_of_panel_meetings:
                                dev.main?.no_of_panel_meetings || 0,
                              expenses: (
                                dev.development_work_expenses || []
                              ).map((e) => ({
                                item_description: e.item_description,
                                required_quantity: e.required_quantity,
                                rate: e.rate,
                                amount: e.amount,
                              })),
                              participants: (
                                dev.panel_meeting_participants || []
                              ).map((p) => ({
                                participant_type: p.participant_type,
                                nos: p.nos,
                                rate_per_hour: p.rate_per_hour,
                                smes: p.smes,
                                amount: p.amount,
                              })),
                            };

                            localStorage.setItem(
                              "draftCourseDevelopmentWorkForm",
                              JSON.stringify(draft)
                            );

                            try {
                              await markSummaryNeedsRefresh(
                                data.payments_main_details.id
                              );
                              setSummaryNeedsRefresh(false);

                              alert(
                                "Draft saved. You can now re-enter Course Development Work."
                              );

                              navigate("/coursecost", { state: { step: 2 } });
                            } catch (err) {
                              alert(
                                err.response?.data?.error ||
                                  "Something went wrong. Try again."
                              );
                            }
                          }}
                        >
                          ✏️ Update Course Development Work
                        </button>
                      )}
                    </div>

                    {data.course_development_work.panel_meeting_participants
                      ?.length > 0 ? (
                      renderTable(
                        "Panel Participants",
                        data.course_development_work.panel_meeting_participants,
                        [
                          "participant_type",
                          "nos",
                          "smes",
                          "rate_per_hour",
                          "amount",
                        ]
                      )
                    ) : (
                      <p>
                        <em>No panel participants data available.</em>
                      </p>
                    )}

                    {data.course_development_work.development_work_expenses
                      ?.length > 0 ? (
                      renderTable(
                        "Development Expenses",
                        data.course_development_work.development_work_expenses,
                        [
                          "item_description",
                          "required_quantity",
                          "rate",
                          "amount",
                        ]
                      )
                    ) : (
                      <p>
                        <em>No development expenses data available.</em>
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2>Course Development Work</h2>
                    <p>
                      <em>
                        No course development work data available. Recalculate
                        cost summary if not done after deletion
                      </em>
                    </p>
                  </>
                )}
              </section>

              <section>
                {/* Course Delivery Costs */}
                {data.course_delivery_costs &&
                data.course_delivery_costs.main ? (
                  <>
                    <h2>Delivery Costs</h2>
                    <p className="cost-line">
                      Cost for Course Delivery - B:
                      <span className="amount-value">
                        Rs.{data.course_delivery_costs.main.total_cost}
                      </span>
                    </p>
                    <p className="cost-line">
                      MD approved status:
                      <span className="amount-value">
                        {data.course_delivery_costs.main.Md_approval_obtained ||
                          " Not approved yet"}
                      </span>
                    </p>
                    <p className="cost-line">
                      MD details:
                      <span className="amount-value">
                        {data.course_delivery_costs.main.Md_details ||
                          " Not provided yet"}
                      </span>
                    </p>
                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            getApiUrl(`/api/course-delivery-cost-full/full/${data.course_delivery_costs.main.id}`),
                            "Course Delivery Costs"
                          )
                        }
                        className="delete-btn3"
                        disabled={deletingLabel === "Course Delivery Costs"}
                      >
                        🗑 Delete Course Delivery Costs
                      </button>
                      {data.course_delivery_costs?.main && (
                        <button
                          className="recalc-btn"
                          // disabled={!isOwner()}
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "This will let you re-enter Course Delivery Costs. Continue?"
                              )
                            )
                              return;

                            const delivery = data.course_delivery_costs;

                            // Step 1: Store draft
                            const draft = {
                              payments_main_details_id:
                                data.payments_main_details.id,
                              Md_approval_obtained:
                                delivery.main?.Md_approval_obtained || "",
                              Md_details: delivery.main?.Md_details || "",
                              cost_items: (delivery.cost_items || []).map(
                                (item) => ({
                                  role: item.role,
                                  no_of_officers: item.no_of_officers,
                                  hours: item.hours,
                                  rate: item.rate,
                                  amount: item.amount,
                                })
                              ),
                              materials: (delivery.materials || []).map(
                                (mat) => ({
                                  item_description: mat.item_description,
                                  required_quantity: mat.required_quantity,
                                  rate: mat.rate,
                                  cost: mat.cost,
                                })
                              ),
                            };

                            localStorage.setItem(
                              "draftCourseDeliveryCostForm",
                              JSON.stringify(draft)
                            );

                            try {
                              await markSummaryNeedsRefresh(
                                data.payments_main_details.id
                              );
                              setSummaryNeedsRefresh(false);

                              alert(
                                "Draft saved. You can now re-enter Course Delivery Costs."
                              );

                              // Step 3: Navigate to form
                              navigate("/coursecost", { state: { step: 3 } });
                            } catch (err) {
                              alert(
                                err.response?.data?.error ||
                                  "Failed to delete existing delivery cost data."
                              );
                            }
                          }}
                        >
                          ✏️ Update Course Delivery Costs
                        </button>
                      )}
                    </div>

                    {data.course_delivery_costs.cost_items?.length > 0 ? (
                      renderTable(
                        "HR Cost Items",
                        data.course_delivery_costs.cost_items,
                        ["role", "no_of_officers", "hours", "rate", "amount"]
                      )
                    ) : (
                      <p>
                        <em>No HR cost items data available.</em>
                      </p>
                    )}

                    {data.course_delivery_costs.materials?.length > 0 ? (
                      renderTable(
                        "Materials",
                        data.course_delivery_costs.materials,
                        [
                          "item_description",
                          "required_quantity",
                          "rate",
                          "cost",
                        ]
                      )
                    ) : (
                      <p>
                        <em>No materials data available.</em>
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2>Delivery Costs</h2>
                    <p>
                      <em>
                        No course delivery costs data available. Recalculate
                        cost summary if not done after deletion
                      </em>
                    </p>
                  </>
                )}
              </section>
              <section>
                {/* Special Case Payments Section */}
                <h2>Special Case Payments</h2>
                {data.special_case_payments?.length > 0 ? (
                  <div className="special-cases-container">
                    {data.special_case_payments.map((item) => (
                      <div key={item.id} className="special-case-card">
                        <div className="special-case-left">
                          <p>
                            <strong>{item.sc_title}</strong>
                          </p>
                          <p>{item.description}</p>
                          <p>
                            {item.percent_payment_or_not === 1 &&
                            item.percentage !== null
                              ? `${item.percentage}% of Total Revenue`
                              : "Full Payment Requested"}
                          </p>
                        </div>
                        <div className="special-case-right">
                          <span>Rs. {item.total_payable}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pfbtns print-hidden">
                      <button
                        className="delete-btn3"
                        onClick={handleDeleteAllSpecialCasePayments}
                      >
                        🗑 Delete All Special Case Payments
                      </button>
                      {/* <button
                        // disabled={!isOwner() && !hasRole("finance_manager")}
                        className="recalc-btn"
                        onClick={handleUpdateSpecialCasePayments}
                      >
                        ✏️ Update Special Case Payments
                      </button> */}
                    </div>
                  </div>
                ) : (
                  <>
                    <p>
                      <em>No special case payments available.</em>
                    </p>
                    {/* {isOwner() && */}

                    {(!data.special_case_payments ||
                      data.special_case_payments.length === 0) && (
                      <div className="pfbtns print-hidden">
                        <button
                          className="recalc-btn"
                          onClick={async () => {
                            try {
                              const draftData = {
                                payments_main_details_id:
                                  data.payments_main_details.id,
                                entries: [],
                              };

                              localStorage.setItem(
                                "special_case_payment_draft",
                                JSON.stringify(draftData)
                              );

                              await clearSpecialCaseFlag(
                                data.payments_main_details.id
                              );
                              setSummaryNeedsRefresh(true);

                              navigate("/coursecost", { state: { step: 5 } });
                            } catch (err) {
                              console.error(
                                "Error marking summary as needing refresh:",
                                err
                              );
                            }
                          }}
                        >
                          ✏️ Set Special Case Payments
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section>
                {/* Course Overheads */}
                {data.course_overheads_main &&
                data.course_overheads_main.main ? (
                  <>
                    <h2>Overheads</h2>
                    <p className="cost-line">
                      Cost for Overheads - C:
                      <span className="amount-value">
                        Rs.{data.course_overheads_main.main.total_cost}
                      </span>
                    </p>
                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            getApiUrl(`/api/course-overheads-cost/full/${data.course_overheads_main.main.id}`),
                            "Course Overheads"
                          )
                        }
                        className="delete-btn3"
                        disabled={deletingLabel === "Course Overheads"}
                      >
                        🗑 Delete Course Overheads
                      </button>
                      {data.course_overheads_main?.main && (
                        <button
                          className="recalc-btn"
                          // disabled={!isOwner()}
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "This will let you re-enter Course Overheads. Continue?"
                              )
                            )
                              return;

                            const overhead = data.course_overheads_main;

                            // Step 1: Store draft
                            const draft = {
                              payments_main_details_id:
                                data.payments_main_details.id,
                              teaching_aids: (overhead.teaching_aids || []).map(
                                (item) => ({
                                  item_description: item.item_description,
                                  required_quantity: item.required_quantity,
                                  required_hours: item.required_hours,
                                  hourly_rate: item.hourly_rate,
                                  cost: item.cost,
                                })
                              ),
                              training_environments: (
                                overhead.training_environments || []
                              ).map((env) => ({
                                item_description: env.item_description,
                                required_hours: env.required_hours,
                                hourly_rate: env.hourly_rate,
                                cost: env.cost,
                              })),
                              overheads: (overhead.overheads || []).map(
                                (o) => ({
                                  item_description: o.item_description,
                                  required_quantity: o.required_quantity,
                                  rate: o.rate,
                                  cost: o.cost,
                                })
                              ),
                            };

                            localStorage.setItem(
                              "draftCourseOverheadsForm",
                              JSON.stringify(draft)
                            );

                            try {
                              await markSummaryNeedsRefresh(
                                data.payments_main_details.id
                              );
                              setSummaryNeedsRefresh(false);

                              alert(
                                "Draft saved. You can now re-enter Course Overheads."
                              );

                              // Step 3: Navigate
                              navigate("/coursecost", { state: { step: 4 } });
                            } catch (err) {
                              alert(
                                err.response?.data?.error ||
                                  "Failed to delete overheads data. Try again."
                              );
                            }
                          }}
                        >
                          ✏️ Update Course Overheads
                        </button>
                      )}
                    </div>

                    {data.course_overheads_main.teaching_aids?.length > 0 ? (
                      renderTable(
                        "Teaching Aids",
                        data.course_overheads_main.teaching_aids,
                        [
                          "item_description",
                          "required_quantity",
                          "required_hours",
                          "hourly_rate",
                          "cost",
                        ]
                      )
                    ) : (
                      <p>
                        <em>No teaching aids data available.</em>
                      </p>
                    )}

                    {data.course_overheads_main.training_environments?.length >
                    0 ? (
                      renderTable(
                        "Training Environments",
                        data.course_overheads_main.training_environments,
                        [
                          "item_description",
                          "required_hours",
                          "hourly_rate",
                          "cost",
                        ]
                      )
                    ) : (
                      <p>
                        <em>No training environments data available.</em>
                      </p>
                    )}

                    {data.course_overheads_main.overheads?.length > 0 ? (
                      renderTable(
                        "Overheads",
                        data.course_overheads_main.overheads,
                        [
                          "item_description",
                          "required_quantity",
                          "rate",
                          "cost",
                        ]
                      )
                    ) : (
                      <p>
                        <em>No overheads data available.</em>
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2>Overheads</h2>
                    <p>
                      <em>
                        No course overheads data available. Recalculate cost
                        summary if not done after deletion
                      </em>
                    </p>
                  </>
                )}
              </section>

              <section>
                {/* Course Cost Summary */}
                {data?.course_cost_summary &&
                deletingLabel !== "Course Cost Summary" ? (
                  <div>
                    <h2>Cost Summary</h2>
                    <div className="course-summary-grid">
                      <div className="summary-left">
                        <p>
                          Total Estimated Cost( A + B + C):{" "}
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.total_cost_expense}
                          </span>
                        </p>
                        <p>
                          + Inflation (
                          {
                            data.course_cost_summary
                              .provision_inflation_percentage
                          }
                          %):{" "}
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.inflation_amount}
                          </span>
                        </p>
                        <p>
                          + NBT ({data.course_cost_summary.NBT_percentage}%):{" "}
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.NBT}
                          </span>
                        </p>
                        <p>
                          + Profit Margin (
                          {data.course_cost_summary.profit_margin_percentage}%):{" "}
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.profit_margin}
                          </span>
                        </p>
                        <p>
                          <strong>
                            + VAT ({data.course_cost_summary.VAT_percentage}%):
                          </strong>
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.VAT}
                          </span>
                        </p>

                        <p>
                          <strong>Total Course Cost: </strong>
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.total_course_cost}
                          </span>
                        </p>
                        <p>
                          Course fee per head (
                          {data.course_cost_summary.total_course_cost}/
                          {data.course_cost_summary.no_of_participants}) :
                          <span className="summary-value">
                            {" "}
                            Rs.{data.course_cost_summary.course_fee_per_head}
                          </span>
                        </p>

                        <p>
                          <strong>Rounded Course Fee Per Head: </strong>
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.Rounded_CFPH}
                          </span>
                        </p>
                        <p>
                          <strong>
                            Total Course fee revenue (
                            {data.course_cost_summary.Rounded_CFPH} x
                            {data.course_cost_summary.no_of_participants}){" "}
                            {" : "}
                          </strong>
                          <span className="summary-value">
                            Rs.{data.course_cost_summary.Rounded_CT}
                          </span>
                        </p>
                        <hr className="SR-hr"></hr>
                        <p>
                          Prepared By:{" "}
                          <span className="summary-value">
                            {data.course_cost_summary.prepared_by}
                          </span>
                        </p>
                        <p>
                          Checked By:{" "}
                          <span className="summary-value">
                            {data.course_cost_summary.check_by ||
                              " Not checked yet"}
                          </span>
                        </p>
                        <p>
                          Special Justifications:{" "}
                          <span className="summary-value">
                            {data.payments_main_details
                              .special_justifications || " Not provided yet"}
                          </span>
                        </p>
                      </div>

                      <div className="summary-right">
                        <p>
                          Accountant Approved Status:{" "}
                          <span className="summary-value">
                            {data.payments_main_details
                              .accountant_approval_obtained ||
                              " Not approved yet"}
                          </span>
                        </p>
                        <p>
                          Accountant message:{" "}
                          <span className="summary-value">
                            {data.payments_main_details.accountant_details ||
                              " Not provided yet"}
                          </span>
                        </p>
                        <hr className="SR-hr"></hr>
                        <p>
                          Sectional Approved Status:{" "}
                          <span className="summary-value">
                            {data.payments_main_details
                              .sectional_approval_obtained ||
                              " Not approved yet"}
                          </span>
                        </p>
                        <p>
                          Sectional type:{" "}
                          <span className="summary-value">
                            {data.payments_main_details.section_type ||
                              " Not provided yet"}
                          </span>
                        </p>
                        <p>
                          Sectional message:{" "}
                          <span className="summary-value">
                            {data.payments_main_details.sectional_details ||
                              " Not provided yet"}
                          </span>
                        </p>
                        <hr className="SR-hr"></hr>
                        <p>
                          DCTM01 Approved Status:{" "}
                          <span className="summary-value">
                            {data.payments_main_details
                              .DCTM01_approval_obtained || " Not approved yet"}
                          </span>
                        </p>
                        <p>
                          DCTM01 message:{" "}
                          <span className="summary-value">
                            {data.payments_main_details.DCTM01_details ||
                              " Not provided yet"}
                          </span>
                        </p>
                        <hr className="SR-hr"></hr>
                        <p>
                          DCTM02 Approved Status:{" "}
                          <span className="summary-value">
                            {data.payments_main_details
                              .DCTM02_approval_obtained || " Not approved yet"}
                          </span>
                        </p>
                        <p>
                          DCTM02 message:{" "}
                          <span className="summary-value">
                            {data.payments_main_details.DCTM02_details ||
                              " Not provided yet"}
                          </span>
                        </p>
                        <hr className="SR-hr"></hr>
                        <p>
                          CTM Approved Status:{" "}
                          <span className="summary-value">
                            {data.payments_main_details.CTM_approved ||
                              " Not approved yet"}
                          </span>
                        </p>
                        <p>
                          CTM message:{" "}
                          <span className="summary-value">
                            {data.payments_main_details.CTM_details ||
                              " Not provided yet"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            getApiUrl(`/api/payment-course-final-summary/${data.course_cost_summary.id}`),
                            "Course Cost Summary"
                          )
                        }
                        className="delete-btn3"
                        disabled={deletingLabel === "Course Cost Summary"}
                      >
                        🗑 Delete Cost Summary
                      </button>
                      <button
                        onClick={handleRefreshSummary}
                        className="recalc-btn"
                        disabled={refreshingSummary}
                      >
                        ♻ Recalculate Summary
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2>Cost Summary</h2>
                    <p>
                      <em>
                        No course cost summary data available. Recalculate cost
                        summary if not done after deletion
                      </em>
                    </p>
                    <div className="pfbtns">
                      <button
                        className="recalc-btn"
                        onClick={() => {
                          const user = JSON.parse(localStorage.getItem("user"));
                          const draftData = {
                            payment_main_details_id:
                              data.payments_main_details.id,
                            check_by: user?.email || "System",
                          };
                          localStorage.setItem(
                            "draftCourseCostSummaryForm",
                            JSON.stringify(draftData)
                          );
                          navigate("/coursecost", { state: { step: 6 } });
                        }}
                      >
                        ⚙️ Calculate Summary
                      </button>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
        {isEditModalOpen && (
          <div className="modal-overlay">
            <div className="modal md2">
              <h3 className="modal-title">Edit Payment Info</h3>

              <div className="modal-body mb-EPI">
                <div className="step-two-grid aid-request-form-type2">
                  {getEditableFields().map((field) => (
                    <div key={field} className="form-step">
                      {field === "course_name" ? (
                        <>
                          <CreatableSelect
                            isClearable
                            styles={customSelectStyles}
                            options={groupedCourseOptions}
                            value={
                              editForm.course_name
                                ? {
                                    value: editForm.course_name,
                                    label: editForm.course_name,
                                  }
                                : null
                            }
                            onChange={(selected) => {
                              const selectedCourse = selected?.value || "";
                              const derivedStream =
                                courseToStreamMap[selectedCourse] || "";
                              setEditForm((prev) => ({
                                ...prev,
                                course_name: selectedCourse,
                                stream: derivedStream, // auto update stream
                              }));
                            }}
                            placeholder=" "
                          />
                          <label
                            className={editForm.course_name ? "active2" : ""}
                          >
                            Course Name
                          </label>
                        </>
                      ) : field === "customer_type" ? (
                        <>
                          <Select
                            styles={customSelectStyles}
                            name="customer_type"
                            options={["Internal", "External", "Mixed"].map(
                              (val) => ({
                                label: val,
                                value: val,
                              })
                            )}
                            value={
                              editForm.customer_type
                                ? {
                                    value: editForm.customer_type,
                                    label: editForm.customer_type,
                                  }
                                : null
                            }
                            onChange={(selected) =>
                              setEditForm((prev) => ({
                                ...prev,
                                customer_type: selected?.value || "",
                              }))
                            }
                            placeholder=" "
                            isClearable
                          />
                          <label
                            className={editForm.customer_type ? "active2" : ""}
                          >
                            Customer Type
                          </label>
                        </>
                      ) : field === "stream" ? (
                        <>
                          <CreatableSelect
                            isClearable
                            styles={customSelectStyles}
                            options={groupedCourseOptions.map((group) => ({
                              value: group.label,
                              label: group.label,
                            }))}
                            value={
                              editForm.stream
                                ? {
                                    value: editForm.stream,
                                    label: editForm.stream,
                                  }
                                : null
                            }
                            onChange={(selected) =>
                              setEditForm((prev) => ({
                                ...prev,
                                stream: selected ? selected.value : "",
                              }))
                            }
                            placeholder=" "
                          />
                          <label className={editForm.stream ? "active2" : ""}>
                            Stream
                          </label>
                        </>
                      ) : field === "date" ? (
                        <>
                          <input
                            className="input"
                            type="date"
                            name="date"
                            value={editForm.date || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                          <label className={editForm.date ? "active2" : ""}>
                            Date
                          </label>
                        </>
                      ) : [
                          "CTM_approved",
                          "accountant_approval_obtained",
                          "sectional_approval_obtained",
                          "DCTM01_approval_obtained",
                          "DCTM02_approval_obtained",
                          "section_type",
                        ].includes(field) ? (
                        <>
                          <Select
                            styles={customSelectStyles}
                            options={
                              field === "section_type"
                                ? [
                                    {
                                      value: "Management Stream",
                                      label: "Management Stream",
                                    },
                                    {
                                      value: "Information System",
                                      label: "Information System",
                                    },
                                    {
                                      value:
                                        "Fire Safety & Occupational Health",
                                      label:
                                        "Fire Safety & Occupational Health",
                                    },
                                    {
                                      value: "Port Operation & Logistics",
                                      label: "Port Operation & Logistics",
                                    },
                                    { value: "Technical", label: "Technical" },
                                    {
                                      value: "Maritime & Seamenship",
                                      label: "Maritime & Seamenship",
                                    },
                                  ]
                                : [
                                    { value: "Pending", label: "Pending" },
                                    { value: "Approved", label: "Approved" },
                                    { value: "Rejected", label: "Rejected" },
                                  ]
                            }
                            value={
                              editForm[field]
                                ? {
                                    label: editForm[field],
                                    value: editForm[field],
                                  }
                                : null
                            }
                            onChange={(selected) =>
                              setEditForm((prev) => ({
                                ...prev,
                                [field]: selected?.value || "",
                              }))
                            }
                            placeholder=" "
                            isClearable
                          />
                          <label className={editForm[field] ? "active2" : ""}>
                            {field.replace(/_/g, " ")}
                          </label>
                        </>
                      ) : [
                          "CTM_details",
                          "accountant_details",
                          "sectional_details",
                          "DCTM01_details",
                          "DCTM02_details",
                          "special_justifications",
                        ].includes(field) ? (
                        <>
                          <textarea
                            className="input"
                            placeholder=" "
                            value={editForm[field] || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                          />
                          <label className={editForm[field] ? "active2" : ""}>
                            {field.replace(/_/g, " ")}
                          </label>
                        </>
                      ) : (
                        <>
                          <input
                            className="input"
                            type={
                              field === "no_of_participants" ? "number" : "text"
                            }
                            placeholder=" "
                            value={editForm[field] || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                          />
                          <label className={editForm[field] ? "active2" : ""}>
                            {field.replace(/_/g, " ")}
                          </label>
                        </>
                      )}
                      {editFormErrors[field] && (
                        <small className="error-text">
                          {editFormErrors[field]}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-gray"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  🚫 Cancel
                </button>
                <button
                  className="btn btn-blue"
                  onClick={async () => {
                    if (!validateEditForm()) return;
                    try {
                      const response = await authRequest(
                        "patch",
                        getApiUrl(`/api/payments/${data.payments_main_details.id}`),
                        editForm
                      );
                      setSuccessMessage("Payment info updated.");
                      setIsEditModalOpen(false);
                      fetchData();

                      // ✅ Only mark refresh if no_of_participants actually changed
                      if (response?.no_of_participants_changed) {
                        await markSummaryNeedsRefresh(
                          data.payments_main_details.id
                        );
                        setSummaryNeedsRefresh(true);
                      }
                    } catch (err) {
                      setError(
                        err.response?.data?.error ||
                          "Failed to update payment info"
                      );
                    }
                  }}
                >
                  ✅ Save
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="floating-reminder-wrapper">
          {summaryFlags &&
            isSpecialFlagCondition(summaryFlags) &&
            data?.special_case_payments?.length > 0 && (
              <div className="floating-reminder">
                ⚠ Special notice: The Special Case Payment requests needed to be
                recalculated before cost summary is recalculated!
              </div>
            )}
          {data?.course_cost_summary &&
            summaryNeedsRefresh !== null &&
            summaryNeedsRefresh && (
              <div className="floating-reminder">
                ⚠ Changes made. Please <strong>recalculate</strong> the cost
                summary.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSingleDetails;
