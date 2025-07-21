import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authRequest } from "../../services/authService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import "./styles/styles.css";

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

  // define fetchData with useCallback, so it's stable and updates if paymentMainDetailsId changes
  const fetchData = useCallback(async () => {
    if (!paymentMainDetailsId) {
      setError("No payment ID provided.");
      return;
    }
    try {
      const res = await authRequest(
        "get",
        `http://localhost:5003/api/payment-sf-display/${paymentMainDetailsId}`
      );
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

  // const renderTable = (title, rows, columns) => (
  //   <>
  //     <h3>{title}</h3>
  //     {rows && rows.length > 0 ? (
  //       <div className="table-wrapper">
  //         <table className="styled-table">
  //           <thead>
  //             <tr>
  //               {columns.map((col) => (
  //                 <th key={col}>{col}</th>
  //               ))}
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {rows.map((row, i) => (
  //               <tr key={i}>
  //                 {columns.map((col) => (
  //                   <td key={col}>{row[col]}</td>
  //                 ))}
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       </div>
  //     ) : (
  //       <p className="empty-table-msg">No data available for {title}</p>
  //     )}
  //   </>
  // );

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

  const handleDelete = (url, label) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${label}? This cannot be undone.`
      )
    )
      return;

    setDeletingLabel(label);

    // ✅ Optimistically update UI before deletion request
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

    // 🔁 Send delete request
    authRequest("delete", url, null, (err) => {
      if (err) {
        setError(err.response?.data?.error || `Failed to delete ${label}`);
      } else {
        setSuccessMessage(`${label} deleted successfully.`);
      }

      // ✅ Refetch after slight delay to get updated backend state
      setTimeout(() => {
        fetchData();
        setDeletingLabel(null); // always reset regardless of success/failure
      }, 1000); // adjust delay if backend is slower
    });
  };

  const handleRefreshSummary = async () => {
    if (!data?.course_cost_summary?.id || !data?.payments_main_details?.id) {
      setError("Missing summary or payment ID.");
      return;
    }

    if (!window.confirm("Recalculate the course cost summary now?")) return;

    setRefreshingSummary(true);

    try {
      // Step 1: Delete existing summary
      await authRequest(
        "delete",
        `http://localhost:5003/api/payment-course-final-summary/${data.course_cost_summary.id}`
      );

      // Step 2: Create new summary
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const userEmail = currentUser?.email || "System";

      const postData = {
        payment_main_details_id: data.payments_main_details.id,
        check_by: userEmail,
      };

      await authRequest(
        "post",
        "http://localhost:5003/api/payment-course-final-summary",
        postData
      );

      setSuccessMessage("Summary recalculated successfully.");
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to recalculate cost summary."
      );
    } finally {
      setRefreshingSummary(false);
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
      doc.text(label, 14, currentY);
      currentY += 6;
    };

    const addTable = (headers, rows) => {
      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: rows,
        theme: "grid",
        margin: { left: 14, right: 14 },
      });
      currentY = doc.lastAutoTable.finalY + 10; // Add spacing after table
    };

    // Course Details
    addSection("Course Details");
    addTable(
      ["Field", "Value"],
      [
        ["Course Name", data.payments_main_details.course_name],
        ["Participants", data.payments_main_details.no_of_participants],
        ["Duration", data.payments_main_details.duration],
        ["Customer Type", data.payments_main_details.customer_type],
        ["Stream", data.payments_main_details.stream],
      ]
    );

    // Course Development Work
    if (data.course_development_work?.main) {
      addSection("Course Development Work - Summary");
      addTable(
        ["Total Cost (A)"],
        [[data.course_development_work.main.total_cost]]
      );

      if (data.course_development_work?.development_work_expenses?.length) {
        addSection("Development Expenses");
        addTable(
          ["Description", "Quantity", "Rate", "Amount"],
          data.course_development_work.development_work_expenses.map((e) => [
            e.item_description,
            e.required_quantity,
            e.rate,
            e.amount,
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
            p.rate_per_hour,
            p.amount,
          ])
        );
      }
    }

    // Course Delivery Costs
    if (data.course_delivery_costs?.main) {
      addSection("Course Delivery Costs - Summary");
      addTable(
        ["Total Cost (B)"],
        [[data.course_delivery_costs.main.total_cost]]
      );

      if (data.course_delivery_costs?.cost_items?.length) {
        addSection("HR Cost Items");
        addTable(
          ["Role", "No of Officers", "Hours", "Rate", "Amount"],
          data.course_delivery_costs.cost_items.map((i) => [
            i.role,
            i.no_of_officers,
            i.hours,
            i.rate,
            i.amount,
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
            m.rate,
            m.cost,
          ])
        );
      }
    }

    // Overheads
    if (data.course_overheads_main?.main) {
      addSection("Overheads - Summary");
      addTable(
        ["Total Cost (C)"],
        [[data.course_overheads_main.main.total_cost]]
      );

      if (data.course_overheads_main?.teaching_aids?.length) {
        addSection("Teaching Aids");
        addTable(
          ["Description", "Quantity", "Hours", "Rate", "Cost"],
          data.course_overheads_main.teaching_aids.map((aid) => [
            aid.item_description,
            aid.required_quantity,
            aid.required_hours,
            aid.hourly_rate,
            aid.cost,
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
            env.hourly_rate,
            env.cost,
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
            oh.rate,
            oh.cost,
          ])
        );
      }
    }

    // Cost Summary
    if (data.course_cost_summary) {
      addSection("Cost Summary");
      addTable(
        ["Label", "Value"],
        [
          ["Total Cost", data.course_cost_summary.total_cost_expense],
          [
            "Provision For Inflation (%)",
            data.course_cost_summary.provision_inflation_percentage,
          ],
          ["NBT", data.course_cost_summary.NBT],
          [
            "Profit Margin (%)",
            data.course_cost_summary.profit_margin_percentage,
          ],
          ["Profit", data.course_cost_summary.profit_margin],
          ["Course Fee Per Head", data.course_cost_summary.course_fee_per_head],
          ["Rounded CFPH", data.course_cost_summary.Rounded_CFPH],
          ["Total Course Revenue", data.course_cost_summary.Rounded_CT],
          ["Prepared By", data.course_cost_summary.prepared_by],
          ["Checked By", data.course_cost_summary.check_by],
          ["CTM Approved", data.payments_main_details.CTM_approved],
          ["CTM Message", data.payments_main_details.CTM_details],
        ]
      );
    }

    // Save the file
    doc.save(
      `Estimated_Cost_Sheet_${data.payments_main_details.course_name}.pdf`
    );
  };

  // const handleDownloadPDF = () => {
  //   const element = contentRef.current;

  //   // Step 1: Hide all elements with class print-hidden
  //   const hiddenEls = element.querySelectorAll(".print-hidden");
  //   hiddenEls.forEach((el) => {
  //     el.dataset.originalDisplay = el.style.display;
  //     el.style.display = "none";
  //   });

  //   // Step 2: Generate PDF
  //   const opt = {
  //     margin: 0.5,
  //     filename: `Estimated_Cost_Sheet_${
  //       data?.payments_main_details?.course_name || "Course"
  //     }.pdf`,
  //     image: { type: "jpeg", quality: 0.98 },
  //     html2canvas: { scale: 2 },
  //     jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  //   };

  //   html2pdf()
  //     .set(opt)
  //     .from(element)
  //     .save()
  //     .then(() => {
  //       // Step 3: Restore original display after export
  //       hiddenEls.forEach((el) => {
  //         el.style.display = el.dataset.originalDisplay || "";
  //         delete el.dataset.originalDisplay;
  //       });
  //     });
  // };

  const handleDownloadCSV = () => {
    if (!data) return;
    const rows = [];

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
    if (data.course_cost_summary) {
      rows.push(["Cost Summary"]);
      rows.push(["Total Cost", data.course_cost_summary.total_cost_expense]);
      rows.push([
        "Provision For Inflation (%)",
        data.course_cost_summary.provision_inflation_percentage,
      ]);
      rows.push(["NBT", data.course_cost_summary.NBT]);
      rows.push([
        "Profit Margin (%)",
        data.course_cost_summary.profit_margin_percentage,
      ]);
      rows.push(["Profit", data.course_cost_summary.profit_margin]);
      rows.push([
        "Course Fee Per Head",
        data.course_cost_summary.course_fee_per_head,
      ]);
      rows.push(["Rounded CFPH", data.course_cost_summary.Rounded_CFPH]);
      rows.push(["Total Course Revenue", data.course_cost_summary.Rounded_CT]);
      rows.push(["Prepared By", data.course_cost_summary.prepared_by]);
      rows.push(["Checked By", data.course_cost_summary.check_by]);
      rows.push([
        "CTM Approved Status",
        data.payments_main_details.CTM_approved,
      ]);
      rows.push(["CTM Message", data.payments_main_details.CTM_details]);
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
              </section>
              {/* Course Development Work */}
              <section>
                {data.course_development_work &&
                data.course_development_work.main ? (
                  <>
                    <h2>Course Development Work</h2>
                    <p>
                      Cost for Course Development - A: Rs.
                      {data.course_development_work.main.total_cost}
                    </p>
                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            `http://localhost:5003/api/course-development-work/full/${data.course_development_work.main.id}`,
                            "Course Development Work"
                          )
                        }
                        className="delete-btn3"
                        disabled={deletingLabel === "Course Development Work"}
                      >
                        🗑 Delete Course Development Work
                      </button>
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
                    <p>
                      Cost for Course Delivery - B: Rs.
                      {data.course_delivery_costs.main.total_cost}
                    </p>
                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            `http://localhost:5003/api/course-delivery-cost-full/full/${data.course_delivery_costs.main.id}`,
                            "Course Delivery Costs"
                          )
                        }
                        className="delete-btn3"
                        disabled={deletingLabel === "Course Delivery Costs"}
                      >
                        🗑 Delete Course Delivery Costs
                      </button>
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
                {/* Course Overheads */}
                {data.course_overheads_main &&
                data.course_overheads_main.main ? (
                  <>
                    <h2>Overheads</h2>
                    <p>
                      Cost for Overheads - C: Rs.
                      {data.course_overheads_main.main.total_cost}
                    </p>
                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            `http://localhost:5003/api/course-overheads-cost/full/${data.course_overheads_main.main.id}`,
                            "Course Overheads"
                          )
                        }
                        className="delete-btn3"
                        disabled={deletingLabel === "Course Overheads"}
                      >
                        🗑 Delete Course Overheads
                      </button>
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
                    <p>
                      Total Estimated Cost( A + B + C): Rs.
                      {data.course_cost_summary.total_cost_expense}
                    </p>
                    <p>
                      Provision For inflation :{" "}
                      {data.course_cost_summary.provision_inflation_percentage}%
                    </p>
                    <p>
                      NBT: Rs.
                      {data.course_cost_summary.NBT}
                    </p>
                    <p>
                      Profit Margin :{" "}
                      {data.course_cost_summary.profit_margin_percentage}%
                    </p>
                    <p>
                      Profit Expected: Rs.
                      {data.course_cost_summary.profit_margin}
                    </p>
                    <p>
                      Course fee per head (
                      {data.course_cost_summary.total_course_cost}/
                      {data.course_cost_summary.no_of_participants}) : Rs.
                      {data.course_cost_summary.course_fee_per_head}
                    </p>
                    <p>
                      <strong>Course fee per head:</strong> Rs.
                      {data.course_cost_summary.Rounded_CFPH}
                    </p>
                    <p>
                      <strong>Total Course fee revenue:</strong> Rs.
                      {data.course_cost_summary.Rounded_CT}
                    </p>
                    <p>Prepared By: {data.course_cost_summary.prepared_by}</p>
                    <p>
                      Checked By:
                      {data.course_cost_summary.check_by || " Not checked yet"}
                    </p>
                    <p>
                      CTM Approved Status:
                      {data.payments_main_details.CTM_approved}
                    </p>
                    <p>
                      CTM message:
                      {data.payments_main_details.CTM_details}
                    </p>
                    <div className="pfbtns print-hidden">
                      <button
                        onClick={() =>
                          handleDelete(
                            `http://localhost:5003/api/payment-course-final-summary/${data.course_cost_summary.id}`,
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
                        // onClick={() => navigate("/coursecost")}
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
                          // navigate("/coursecost");
                          navigate("/coursecost", { state: { step: 5 } });
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
      </div>
    </div>
  );
};

export default PaymentSingleDetails;
