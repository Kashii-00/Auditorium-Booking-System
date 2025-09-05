import React, { useEffect, useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { getApiUrl } from "../../utils/apiUrl";
import { authRequest } from "../../services/authService";
import "./styles/styles.css";

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];
const CATEGORY = "Course Development Work";

// Normalize user ro  les like backend
const normalizeRoles = (rawRole) => {
  if (!rawRole) return [];
  if (Array.isArray(rawRole)) return rawRole;
  try {
    return JSON.parse(rawRole);
  } catch {
    return [rawRole];
  }
};

// const customSelectStyles = {
//   control: (base, state) => ({
//     ...base,
//     backgroundColor: "transparent",
//     borderColor: state.isFocused ? "#01eeff" : "#00a6ff9d",
//     borderWidth: 3,
//     borderRadius: 4,
//     minHeight: 32,
//     boxShadow: "none",
//     fontSize: "12px",
//     "&:hover": { borderColor: "#01eeff" },
//   }),
//   valueContainer: (base) => ({ ...base, padding: "2px 6px", fontSize: "12px" }),
//   placeholder: (base) => ({ ...base, color: "#999", fontSize: "12px" }),
//   input: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
//   singleValue: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
//   menu: (base) => ({
//     ...base,
//     backgroundColor: "#003b5a",
//     color: "#e3eaf5",
//     fontSize: "10px",
//     borderRadius: 4,
//   }),
//   option: (base, state) => ({
//     ...base,
//     backgroundColor: state.isFocused ? "#01eeff" : "transparent",
//     color: state.isFocused ? "#000" : "#e3eaf5",
//     fontSize: "12px",
//     padding: "6px 10px",
//   }),
// };

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "transparent",
    borderColor: state.isFocused ? "#01eeff" : "#00a6ff9d",
    borderWidth: 2,
    borderRadius: 6,
    minHeight: 36,
    boxShadow: "none",
    fontSize: "14px",
    "&:hover": { borderColor: "#01eeff" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 6px", fontSize: "14px" }),
  placeholder: (base) => ({ ...base, color: "#999", fontSize: "14px" }),
  input: (base) => ({ ...base, color: "#000", fontSize: "14px" }),
  singleValue: (base) => ({ ...base, color: "#000", fontSize: "14px" }),
  menu: (base) => ({ ...base, backgroundColor: "#f0f4f8", borderRadius: 6 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#dbeafe" : "transparent",
    color: "#000",
    fontSize: "14px",
    padding: "8px 12px",
  }),
};

const extractPrivilege = () => {
  try {
    const userString = localStorage.getItem("user");
    if (!userString) return false;
    const user = JSON.parse(userString);
    const roles = normalizeRoles(user?.role);
    return roles.some((r) => PRIVILEGED_ROLES.includes(r));
  } catch (e) {
    console.warn("Failed to read user role:", e);
    return false;
  }
};

const CourseDevelopmentWorkForm = ({
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const DRAFT_KEY = "draftCourseDevelopmentWorkForm";

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          payments_main_details_id: "",
          no_of_panel_meetings: 0,
          expenses: [],
          participants: [],
        };
  });

  const [rates, setRates] = useState([]);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const [focused, setFocused] = useState({});

  const onFocus = (name) => setFocused((f) => ({ ...f, [name]: true }));
  const onBlur = (name) => setFocused((f) => ({ ...f, [name]: false }));

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const fetchRatesAndPrivilege = async () => {
      try {
        const response = await authRequest("get", getApiUrl("/rates"));
        setRates(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Error fetching rates:", err);
        setRates([]);
      }
      setIsPrivileged(extractPrivilege());
    };
    fetchRatesAndPrivilege();
  }, []);

  const getRateInfo = (desc) => {
    if (!desc) return undefined;
    return rates.find(
      (r) =>
        r.item_description.toLowerCase() === desc.toLowerCase() &&
        r.category === CATEGORY
    );
  };

  const expenseOptions = useMemo(() => {
    return rates
      .filter(
        (r) =>
          r.category === CATEGORY &&
          !r.item_description.toLowerCase().includes("sme")
      )
      .map((r) => ({ label: r.item_description, value: r.item_description }));
  }, [rates]);

  const participantOptions = useMemo(() => {
    return rates
      .filter(
        (r) =>
          r.category === CATEGORY &&
          r.item_description.toLowerCase().includes("sme")
      )
      .map((r) => ({ label: r.item_description, value: r.item_description }));
  }, [rates]);

  const clearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({
      payments_main_details_id: "",
      no_of_panel_meetings: 0,
      expenses: [],
      participants: [],
    });
  };

  // --- EXPENSES HANDLERS ---
  const updateExpense = (index, updatedItem) => {
    const updated = [...formData.expenses];
    updated[index] = updatedItem;
    setFormData((prev) => ({ ...prev, expenses: updated }));
  };

  const handleExpenseChange = (index, field, value) => {
    let updatedItem = { ...formData.expenses[index], [field]: value };

    const rateEntry = getRateInfo(updatedItem.item_description);

    // Reset dependent fields on item_description change
    if (field === "item_description") {
      updatedItem.required_quantity = "";
      updatedItem.rate = rateEntry ? rateEntry.rate : ""; // Prefill rate here on item_description change
      updatedItem.amount = "";
    }

    // Convert numeric inputs safely
    const qty =
      updatedItem.required_quantity !== ""
        ? Number(updatedItem.required_quantity)
        : NaN;
    const rate = updatedItem.rate !== "" ? Number(updatedItem.rate) : NaN;

    if (rateEntry) {
      if (field !== "item_description") {
        // Don't override rate on edits to allow free editing (including clearing)
        // Just keep the existing updatedItem.rate as is
      }

      if (!isPrivileged) {
        if (rateEntry.rate_type === "Quantity") {
          updatedItem.amount = !isNaN(qty) ? rateEntry.rate * qty : "";
        } else if (rateEntry.rate_type === "Full Payment") {
          // amount stays as user inputs, no override
          if (
            (updatedItem.amount === "" || isNaN(Number(updatedItem.amount))) &&
            !isNaN(qty)
          ) {
            updatedItem.amount = rateEntry.rate * qty;
          }
        }
      } else {
        // privileged users can edit rate and amount freely
        if (rateEntry.rate_type === "Quantity" && !isNaN(qty) && !isNaN(rate)) {
          updatedItem.amount = rate * qty;
        }
      }
    } else {
      // No rate entry found
      if (!isNaN(qty) && !isNaN(rate)) {
        updatedItem.amount = qty * rate;
      }
    }

    updateExpense(index, updatedItem);
  };

  // --- PARTICIPANTS HANDLERS ---
  const updateParticipant = (index, updatedItem) => {
    const updated = [...formData.participants];
    updated[index] = updatedItem;
    setFormData((prev) => ({ ...prev, participants: updated }));
  };

  const handleParticipantChange = (index, field, value) => {
    let updatedItem = { ...formData.participants[index], [field]: value };

    if (field === "participant_type") {
      // If cleared via "X", reset everything
      if (!value) {
        updatedItem = {
          participant_type: "",
          nos: "",
          rate_per_hour: "",
          smes: "",
          amount: "",
        };
      } else {
        const rateEntry = getRateInfo(value); // use value instead of updatedItem
        updatedItem.nos = "";
        updatedItem.rate_per_hour = rateEntry ? rateEntry.rate : "";
        updatedItem.amount = "";
        updatedItem.smes = "";
      }
    } else {
      const rateEntry = getRateInfo(updatedItem.participant_type); // normal usage
      const nos = updatedItem.nos !== "" ? Number(updatedItem.nos) : NaN;
      const rate =
        updatedItem.rate_per_hour !== ""
          ? Number(updatedItem.rate_per_hour)
          : NaN;

      if (rateEntry) {
        if (!isPrivileged) {
          if (rateEntry.rate_type === "Hourly") {
            updatedItem.amount = !isNaN(nos) ? nos * rateEntry.rate : "";
          }
        } else {
          if (!isNaN(nos) && !isNaN(rate)) {
            updatedItem.amount = nos * rate;
          }
        }
      } else {
        if (!isNaN(nos) && !isNaN(rate)) {
          updatedItem.amount = nos * rate;
        }
      }
    }

    updateParticipant(index, updatedItem);
  };

  const addExpense = () => {
    setFormData((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        { item_description: "", required_quantity: "", rate: "", amount: "" },
      ],
    }));
  };

  const addParticipant = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          participant_type: "",
          nos: "",
          rate_per_hour: "",
          smes: "",
          amount: "",
        },
      ],
    }));
  };

  const removeExpense = (index) => {
    setFormData((prev) => {
      const updated = [...prev.expenses];
      updated.splice(index, 1);
      return { ...prev, expenses: updated };
    });
  };

  const removeParticipant = (index) => {
    setFormData((prev) => {
      const updated = [...prev.participants];
      updated.splice(index, 1);
      return { ...prev, participants: updated };
    });
  };

  const handleFinalSubmit = async () => {
    const payload = {
      payments_main_details_id: Number(formData.payments_main_details_id),
      no_of_panel_meetings: Number(formData.no_of_panel_meetings),
      expenses: formData.expenses
        .filter((e) => e.item_description)
        .map(({ item_description, required_quantity, rate, amount }) => ({
          item_description,
          required_quantity:
            required_quantity === "" ? undefined : Number(required_quantity),
          rate: rate === "" ? undefined : Number(rate),
          amount: amount === "" ? undefined : Number(amount),
        })),
      participants: formData.participants
        .filter((p) => p.participant_type)
        .map(({ participant_type, nos, rate_per_hour, smes, amount }) => ({
          participant_type,
          nos: nos === "" ? undefined : Number(nos),
          rate_per_hour:
            rate_per_hour === "" ? undefined : Number(rate_per_hour),
          smes: smes || "",
          amount: amount === "" ? undefined : Number(amount),
        })),
    };

    try {
      await authRequest(
        "post",
        getApiUrl("/course-development-work/full"),
        payload
      );
      setSuccessMessage("Course Development Work submitted successfully.");
      clearForm();
      setReviewMode(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Submission failed.");
      setReviewMode(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setReviewMode(true);
  };

  // if (reviewMode) {
  //   return (
  //     <div className="mainCostCon">
  //       <div className="review2Con">
  //         <h2>Review Course Development Work</h2>

  //         <div>
  //           <strong>Payments Main Details ID:</strong>{" "}
  //           {formData.payments_main_details_id || <em>Not Provided</em>}
  //         </div>
  //         <div>
  //           <strong>No. of Panel Meetings:</strong>{" "}
  //           {formData.no_of_panel_meetings || <em>Not Provided</em>}
  //         </div>

  //         <section>
  //           <h3>Expenses</h3>
  //           {formData.expenses.length === 0 ? (
  //             <p>
  //               <em>No expenses added.</em>
  //             </p>
  //           ) : (
  //             <div className="table-wrapper">
  //               <table>
  //                 <thead>
  //                   <tr>
  //                     <th>Item Description</th>
  //                     <th>Required Quantity</th>
  //                     <th>Rate</th>
  //                     <th>Amount</th>
  //                   </tr>
  //                 </thead>
  //                 <tbody>
  //                   {formData.expenses.map((e, i) => (
  //                     <tr key={i}>
  //                       <td>{e.item_description || <em>N/A</em>}</td>
  //                       <td>{e.required_quantity ?? <em>N/A</em>}</td>
  //                       <td>{e.rate ?? <em>N/A</em>}</td>
  //                       <td>{e.amount ?? <em>N/A</em>}</td>
  //                     </tr>
  //                   ))}
  //                 </tbody>
  //               </table>
  //             </div>
  //           )}
  //         </section>

  //         <section>
  //           <h3>Participants</h3>
  //           {formData.participants.length === 0 ? (
  //             <p>
  //               <em>No participants added.</em>
  //             </p>
  //           ) : (
  //             <div className="table-wrapper">
  //               <table>
  //                 <thead>
  //                   <tr>
  //                     <th>Participant Type</th>
  //                     <th>Nos</th>
  //                     <th>Rate Per Hour</th>
  //                     <th>SMEs</th>
  //                     <th>Amount</th>
  //                   </tr>
  //                 </thead>
  //                 <tbody>
  //                   {formData.participants.map((p, i) => (
  //                     <tr key={i}>
  //                       <td>{p.participant_type || <em>N/A</em>}</td>
  //                       <td>{p.nos ?? <em>N/A</em>}</td>
  //                       <td>{p.rate_per_hour ?? <em>N/A</em>}</td>
  //                       <td>{p.smes || <em>N/A</em>}</td>
  //                       <td>{p.amount ?? <em>N/A</em>}</td>
  //                     </tr>
  //                   ))}
  //                 </tbody>
  //               </table>
  //             </div>
  //           )}
  //         </section>

  //         <div className="review-buttons">
  //           <button
  //             type="button"
  //             className="ccfbtn"
  //             onClick={() => setReviewMode(false)}
  //           >
  //             Back to Edit
  //           </button>
  //           <button
  //             type="button"
  //             className="ccfbtn"
  //             onClick={handleFinalSubmit}
  //           >
  //             Confirm & Submit
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  if (reviewMode) {
    return (
      <div className="space-y-6 w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800">
          Review Course Development Work
        </h2>

        <div className="space-y-2 text-gray-700">
          <div>
            <strong>Payments Main Details ID:</strong>{" "}
            {formData.payments_main_details_id || <em>Not Provided</em>}
          </div>
          <div>
            <strong>No. of Panel Meetings:</strong>{" "}
            {formData.no_of_panel_meetings || <em>Not Provided</em>}
          </div>
        </div>

        {/* Expenses Table */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700">Expenses</h3>
          {formData.expenses.length === 0 ? (
            <p className="text-gray-500">
              <em>No expenses added.</em>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 text-gray-800 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Item Description</th>
                    <th className="px-4 py-2">Required Quantity</th>
                    <th className="px-4 py-2">Rate</th>
                    <th className="px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.expenses.map((e, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">
                        {e.item_description || <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">
                        {e.required_quantity ?? <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">{e.rate ?? <em>N/A</em>}</td>
                      <td className="px-4 py-2">{e.amount ?? <em>N/A</em>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Participants Table */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700">Participants</h3>
          {formData.participants.length === 0 ? (
            <p className="text-gray-500">
              <em>No participants added.</em>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 text-gray-800 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Participant Type</th>
                    <th className="px-4 py-2">Nos</th>
                    <th className="px-4 py-2">Rate Per Hour</th>
                    <th className="px-4 py-2">SMEs</th>
                    <th className="px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.participants.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">
                        {p.participant_type || <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">{p.nos ?? <em>N/A</em>}</td>
                      <td className="px-4 py-2">
                        {p.rate_per_hour ?? <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">{p.smes || <em>N/A</em>}</td>
                      <td className="px-4 py-2">{p.amount ?? <em>N/A</em>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Review Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => setReviewMode(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    // <div className="mainCostCon">
    //   <form className="aid-request-form-type2" onSubmit={handleSubmit}>
    //     <h2 className="page-description-type2 h2-type2">
    //       Fill Out The Course Development Work{" "}
    //       {isPrivileged && <span style={{ color: "cyan" }}>(PRIVILEGED)</span>}
    //     </h2>
    //     {successMessage && (
    //       <div className="success-popup2">{successMessage}</div>
    //     )}
    //     {error && <div className="error-popup2">{error}</div>}

    //     <div className="step-two-grid aid-request-form-type2">
    //       {/* Payments Main Details ID */}
    //       <div className=" form-step">
    //         <input
    //           type="number"
    //           name="payments_main_details_id"
    //           value={formData.payments_main_details_id}
    //           onChange={(e) =>
    //             setFormData((prev) => ({
    //               ...prev,
    //               payments_main_details_id: e.target.value,
    //             }))
    //           }
    //           required
    //           min={1}
    //           placeholder=" "
    //           onFocus={() => onFocus("payments_main_details_id")}
    //           onBlur={() => onBlur("payments_main_details_id")}
    //         />
    //         <label
    //           className={
    //             focused.payments_main_details_id ||
    //             formData.payments_main_details_id
    //               ? "active2"
    //               : ""
    //           }
    //         >
    //           Payments Main Details ID
    //         </label>
    //       </div>

    //       {/* No of Panel Meetings */}
    //       <div className="form-step">
    //         <input
    //           type="number"
    //           name="no_of_panel_meetings"
    //           value={formData.no_of_panel_meetings}
    //           onChange={(e) =>
    //             setFormData((prev) => ({
    //               ...prev,
    //               no_of_panel_meetings: e.target.value,
    //             }))
    //           }
    //           required
    //           min={0}
    //           placeholder=" "
    //           onFocus={() => onFocus("no_of_panel_meetings")}
    //           onBlur={() => onBlur("no_of_panel_meetings")}
    //         />
    //         <label
    //           className={
    //             focused.no_of_panel_meetings || formData.no_of_panel_meetings
    //               ? "active2"
    //               : ""
    //           }
    //         >
    //           No of Panel Meetings
    //         </label>
    //       </div>
    //     </div>

    //     <h2 className="page-description-type2 h2-type2">Expenses</h2>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.expenses.map((exp, idx) => {
    //         const rateEntry = getRateInfo(exp.item_description);
    //         const rateLocked = !!rateEntry && !isPrivileged;
    //         const amountLocked =
    //           !!rateEntry &&
    //           rateEntry.rate_type !== "Full Payment" &&
    //           !isPrivileged;

    //         return (
    //           <div key={idx} className="expense-entry">
    //             <div className="form-step" style={{ flex: 2, minWidth: 200 }}>
    //               <CreatableSelect
    //                 styles={customSelectStyles}
    //                 placeholder=" "
    //                 value={
    //                   exp.item_description
    //                     ? {
    //                         label: exp.item_description,
    //                         value: exp.item_description,
    //                       }
    //                     : null
    //                 }
    //                 onChange={(option) =>
    //                   handleExpenseChange(
    //                     idx,
    //                     "item_description",
    //                     option?.value || ""
    //                   )
    //                 }
    //                 options={expenseOptions}
    //                 isClearable
    //                 isSearchable
    //                 onFocus={() => onFocus(`exp_desc_${idx}`)}
    //                 onBlur={() => onBlur(`exp_desc_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`exp_desc_${idx}`] || exp.item_description
    //                     ? "active2"
    //                     : ""
    //                 }
    //               >
    //                 Item Description
    //               </label>
    //             </div>
    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 value={exp.required_quantity}
    //                 onChange={(e) =>
    //                   handleExpenseChange(
    //                     idx,
    //                     "required_quantity",
    //                     e.target.value
    //                   )
    //                 }
    //                 min={1}
    //                 step={1}
    //                 placeholder=" "
    //                 onFocus={() => onFocus(`exp_qty_${idx}`)}
    //                 onBlur={() => onBlur(`exp_qty_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`exp_qty_${idx}`] || exp.required_quantity
    //                     ? "active2"
    //                     : ""
    //                 }
    //               >
    //                 Required Quantity
    //               </label>
    //             </div>
    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 step="0.01"
    //                 value={exp.rate}
    //                 onChange={(e) =>
    //                   handleExpenseChange(idx, "rate", e.target.value)
    //                 }
    //                 readOnly={rateLocked}
    //                 placeholder=" "
    //                 onFocus={() => onFocus(`exp_rate_${idx}`)}
    //                 onBlur={() => onBlur(`exp_rate_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`exp_rate_${idx}`] || exp.rate ? "active2" : ""
    //                 }
    //               >
    //                 Rate
    //               </label>
    //             </div>
    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 step="0.01"
    //                 value={exp.amount}
    //                 onChange={(e) =>
    //                   handleExpenseChange(idx, "amount", e.target.value)
    //                 }
    //                 readOnly={amountLocked}
    //                 title={amountLocked ? "Locked by rate table" : ""}
    //                 placeholder=" "
    //                 onFocus={() => onFocus(`exp_amt_${idx}`)}
    //                 onBlur={() => onBlur(`exp_amt_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`exp_amt_${idx}`] || exp.amount ? "active2" : ""
    //                 }
    //               >
    //                 Amount
    //               </label>
    //             </div>
    //             <div className="pfbtns">
    //               <button
    //                 type="button"
    //                 className="RemAdd"
    //                 onClick={() => removeExpense(idx)}
    //               >
    //                 Remove
    //               </button>
    //             </div>
    //           </div>
    //         );
    //       })}
    //     </div>
    //     <div className="pfbtns">
    //       <button type="button" className="addNew" onClick={addExpense}>
    //         + Add Expense
    //       </button>
    //     </div>

    //     <h2 className="page-description-type2 h2-type2">Participants</h2>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.participants.map((p, idx) => {
    //         const rateEntry = getRateInfo(p.participant_type);
    //         const rateLocked = !!rateEntry && !isPrivileged;
    //         const amountLocked = !!rateEntry && !isPrivileged;

    //         return (
    //           <div key={idx} className="participant-entry">
    //             <div className="form-step" style={{ flex: 2, minWidth: 200 }}>
    //               <CreatableSelect
    //                 styles={customSelectStyles}
    //                 placeholder=" "
    //                 value={
    //                   p.participant_type
    //                     ? {
    //                         label: p.participant_type,
    //                         value: p.participant_type,
    //                       }
    //                     : null
    //                 }
    //                 onChange={(option) =>
    //                   handleParticipantChange(
    //                     idx,
    //                     "participant_type",
    //                     option?.value || ""
    //                   )
    //                 }
    //                 options={participantOptions}
    //                 isClearable
    //                 isSearchable
    //                 onFocus={() => onFocus(`part_type_${idx}`)}
    //                 onBlur={() => onBlur(`part_type_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`part_type_${idx}`] || p.participant_type
    //                     ? "active2"
    //                     : ""
    //                 }
    //               >
    //                 Participant Type
    //               </label>
    //             </div>
    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 value={p.nos}
    //                 onChange={(e) =>
    //                   handleParticipantChange(idx, "nos", e.target.value)
    //                 }
    //                 min={1}
    //                 step={1}
    //                 placeholder=" "
    //                 onFocus={() => onFocus(`part_nos_${idx}`)}
    //                 onBlur={() => onBlur(`part_nos_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`part_nos_${idx}`] || p.nos ? "active2" : ""
    //                 }
    //               >
    //                 Nos
    //               </label>
    //             </div>
    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 step="0.01"
    //                 value={p.rate_per_hour}
    //                 onChange={(e) =>
    //                   handleParticipantChange(
    //                     idx,
    //                     "rate_per_hour",
    //                     e.target.value
    //                   )
    //                 }
    //                 readOnly={rateLocked}
    //                 placeholder=" "
    //                 onFocus={() => onFocus(`part_rate_${idx}`)}
    //                 onBlur={() => onBlur(`part_rate_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`part_rate_${idx}`] || p.rate_per_hour
    //                     ? "active2"
    //                     : ""
    //                 }
    //               >
    //                 Rate Per Hour
    //               </label>
    //             </div>
    //             <div className="form-step" style={{ flex: 1 }}>
    //               <Select
    //                 styles={customSelectStyles}
    //                 options={[
    //                   { value: "Yes", label: "Yes" },
    //                   { value: "No", label: "No" },
    //                 ]}
    //                 value={p.smes ? { value: p.smes, label: p.smes } : null}
    //                 onChange={(selected) =>
    //                   handleParticipantChange(
    //                     idx,
    //                     "smes",
    //                     selected?.value || ""
    //                   )
    //                 }
    //                 onFocus={() => onFocus(`part_smes_${idx}`)}
    //                 onBlur={() => onBlur(`part_smes_${idx}`)}
    //                 placeholder=" "
    //                 isClearable
    //               />
    //               <label
    //                 className={
    //                   focused[`part_smes_${idx}`] || p.smes ? "active2" : ""
    //                 }
    //               >
    //                 SMEs
    //               </label>
    //             </div>

    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 step="0.01"
    //                 value={p.amount}
    //                 onChange={(e) =>
    //                   handleParticipantChange(idx, "amount", e.target.value)
    //                 }
    //                 readOnly={amountLocked}
    //                 title={amountLocked ? "Locked by rate table" : ""}
    //                 placeholder=" "
    //                 onFocus={() => onFocus(`part_amt_${idx}`)}
    //                 onBlur={() => onBlur(`part_amt_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`part_amt_${idx}`] || p.amount ? "active2" : ""
    //                 }
    //               >
    //                 Amount
    //               </label>
    //             </div>
    //             <div className="pfbtns">
    //               <button
    //                 type="button"
    //                 className="RemAdd"
    //                 onClick={() => removeParticipant(idx)}
    //               >
    //                 Remove
    //               </button>
    //             </div>
    //           </div>
    //         );
    //       })}
    //     </div>
    //     <div className="pfbtns">
    //       <button type="button" className="addNew" onClick={addParticipant}>
    //         + Add Participant
    //       </button>
    //     </div>
    //     <hr className="form-divider" />
    //     <div className="form-buttons-sticky btnHalf">
    //       <div className="navigation-buttons">
    //         <button
    //           type="submit"
    //           className="ccfbtn"
    //           style={{ marginRight: "10px" }}
    //         >
    //           Review
    //         </button>
    //         <button type="button" className="ccfbtn" onClick={clearForm}>
    //           Clear Form
    //         </button>
    //       </div>
    //     </div>
    //   </form>
    // </div>

    <div className="space-y-6 w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Fill Out The Course Development Work{" "}
          {isPrivileged && <span className="text-cyan-500">(PRIVILEGED)</span>}
        </h2>

        {successMessage && (
          <div className="p-3 bg-green-100 text-green-800 rounded shadow">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded shadow">
            {error}
          </div>
        )}

        {/* Payments Main Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 text-gray-700 font-medium">
              Payments Main Details ID
            </label>
            <input
              type="number"
              name="payments_main_details_id"
              value={formData.payments_main_details_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  payments_main_details_id: e.target.value,
                }))
              }
              required
              min={1}
              className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                         focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                         hover:border-[#01eeff] transition"
            />
          </div>
          <div>
            <label className="mb-1 text-gray-700 font-medium">
              No of Panel Meetings
            </label>
            <input
              type="number"
              name="no_of_panel_meetings"
              value={formData.no_of_panel_meetings}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  no_of_panel_meetings: e.target.value,
                }))
              }
              required
              min={0}
              className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                         focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                         hover:border-[#01eeff] transition"
            />
          </div>
        </div>

        {/* Expenses */}
        <h2 className="text-xl font-semibold text-gray-800">Expenses</h2>
        <div className="space-y-4">
          {formData.expenses.map((exp, idx) => {
            const rateEntry = getRateInfo(exp.item_description);
            const rateLocked = !!rateEntry && !isPrivileged;
            const amountLocked =
              !!rateEntry &&
              rateEntry.rate_type !== "Full Payment" &&
              !isPrivileged;

            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
              >
                <div className="col-span-2">
                  <label className="mb-1 text-gray-700 font-medium">
                    Item Description
                  </label>
                  <CreatableSelect
                    styles={customSelectStyles}
                    placeholder=" "
                    value={
                      exp.item_description
                        ? {
                            label: exp.item_description,
                            value: exp.item_description,
                          }
                        : null
                    }
                    onChange={(option) =>
                      handleExpenseChange(
                        idx,
                        "item_description",
                        option?.value || ""
                      )
                    }
                    options={expenseOptions}
                    isClearable
                    isSearchable
                  />
                </div>
                <div>
                  <label className="mb-1 text-gray-700 font-medium">
                    Required Quantity
                  </label>
                  <input
                    type="number"
                    value={exp.required_quantity}
                    onChange={(e) =>
                      handleExpenseChange(
                        idx,
                        "required_quantity",
                        e.target.value
                      )
                    }
                    min={1}
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                               focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                               hover:border-[#01eeff] transition"
                  />
                </div>
                <div>
                  <label className="mb-1 text-gray-700 font-medium">Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={exp.rate}
                    onChange={(e) =>
                      handleExpenseChange(idx, "rate", e.target.value)
                    }
                    readOnly={rateLocked}
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                               focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                               hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 text-gray-700 font-medium">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={exp.amount}
                    onChange={(e) =>
                      handleExpenseChange(idx, "amount", e.target.value)
                    }
                    readOnly={amountLocked}
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                               focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                               hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeExpense(idx)}
                    className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addExpense}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          + Add Expense
        </button>

        {/* Participants */}
        <h2 className="text-xl font-semibold text-gray-800">Participants</h2>
        <div className="space-y-4">
          {formData.participants.map((p, idx) => {
            const rateEntry = getRateInfo(p.participant_type);
            const rateLocked = !!rateEntry && !isPrivileged;
            const amountLocked = !!rateEntry && !isPrivileged;

            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
              >
                <div className="col-span-2">
                  <label className="mb-1 text-gray-700 font-medium">
                    Participant Type
                  </label>
                  <CreatableSelect
                    styles={customSelectStyles}
                    placeholder=" "
                    value={
                      p.participant_type
                        ? {
                            label: p.participant_type,
                            value: p.participant_type,
                          }
                        : null
                    }
                    onChange={(option) =>
                      handleParticipantChange(
                        idx,
                        "participant_type",
                        option?.value || ""
                      )
                    }
                    options={participantOptions}
                    isClearable
                    isSearchable
                  />
                </div>
                <div>
                  <label className="mb-1 text-gray-700 font-medium">Nos</label>
                  <input
                    type="number"
                    value={p.nos}
                    onChange={(e) =>
                      handleParticipantChange(idx, "nos", e.target.value)
                    }
                    min={1}
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                               focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                               hover:border-[#01eeff] transition"
                  />
                </div>
                <div>
                  <label className="mb-1 text-gray-700 font-medium">
                    Rate Per Hour
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={p.rate_per_hour}
                    onChange={(e) =>
                      handleParticipantChange(
                        idx,
                        "rate_per_hour",
                        e.target.value
                      )
                    }
                    readOnly={rateLocked}
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                               focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                               hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 text-gray-700 font-medium">SMEs</label>
                  <Select
                    styles={customSelectStyles}
                    options={[
                      { value: "Yes", label: "Yes" },
                      { value: "No", label: "No" },
                    ]}
                    value={p.smes ? { value: p.smes, label: p.smes } : null}
                    onChange={(selected) =>
                      handleParticipantChange(
                        idx,
                        "smes",
                        selected?.value || ""
                      )
                    }
                    placeholder=" "
                    isClearable
                  />
                </div>
                <div>
                  <label className="mb-1 text-gray-700 font-medium">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={p.amount}
                    onChange={(e) =>
                      handleParticipantChange(idx, "amount", e.target.value)
                    }
                    readOnly={amountLocked}
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                               focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                               hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeParticipant(idx)}
                    className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addParticipant}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          + Add Participant
        </button>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Review
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseDevelopmentWorkForm;
