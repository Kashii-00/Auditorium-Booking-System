import React, { useState, useEffect } from "react";
import Select from "react-select";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";

const SPECIAL_CASE_DRAFT_KEY = "special_case_payment_draft";
const percentPaymentOptions = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

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

const SpecialCasePaymentsForm = ({
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SPECIAL_CASE_DRAFT_KEY));

      const normalizedEntries = Array.isArray(saved?.entries)
        ? saved.entries.map((entry) => ({
            ...entry,
            percent_payment_or_not:
              entry.percent_payment_or_not === true ||
              entry.percent_payment_or_not === "true" ||
              entry.percent_payment_or_not === 1
                ? true
                : false,
          }))
        : [];

      return {
        payments_main_details_id: saved?.payments_main_details_id || "",
        entries: normalizedEntries,
      };
    } catch {
      return { payments_main_details_id: "", entries: [] };
    }
  });

  const [focused, setFocused] = useState({});
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(SPECIAL_CASE_DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleFocus = (name) =>
    setFocused((prev) => ({ ...prev, [name]: true }));
  const handleBlur = (name) =>
    setFocused((prev) => ({ ...prev, [name]: false }));

  const handleEntryChange = (index, field, value) => {
    const updatedEntries = [...formData.entries];
    let updatedEntry = { ...updatedEntries[index], [field]: value };

    if (field === "percent_payment_or_not") {
      if (value === true) {
        // Percent payment selected, clear total_payable
        updatedEntry.total_payable = "";
      } else if (value === false) {
        // Not percent payment, clear percentage
        updatedEntry.percentage = "";
      }
    }

    updatedEntries[index] = updatedEntry;
    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
  };

  const addEntry = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          sc_title: "",
          description: "",
          percent_payment_or_not: null,
          percentage: "",
          total_payable: "",
        },
      ],
    }));
  };

  const removeEntry = (index) => {
    const updated = [...formData.entries];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, entries: updated }));
  };

  const clearForm = () => {
    localStorage.removeItem(SPECIAL_CASE_DRAFT_KEY);
    setFormData({ payments_main_details_id: "", entries: [] });
    setReviewMode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (
      !formData.payments_main_details_id ||
      isNaN(+formData.payments_main_details_id)
    ) {
      setError("Please provide a valid Payments Main Details ID.");
      return;
    }

    for (let i = 0; i < formData.entries.length; i++) {
      const entry = formData.entries[i];
      if (!entry.sc_title || entry.percent_payment_or_not === null) {
        setError(`Entry ${i + 1} is missing required fields.`);
        return;
      }
      if (
        entry.percent_payment_or_not &&
        (!entry.percentage || +entry.percentage <= 0)
      ) {
        setError(`Entry ${i + 1} requires a valid percentage.`);
        return;
      }
      if (
        !entry.percent_payment_or_not &&
        (!entry.total_payable || +entry.total_payable <= 0)
      ) {
        setError(`Entry ${i + 1} requires a valid total payable.`);
        return;
      }
    }

    setReviewMode(true);
  };

  const handleFinalSubmit = async () => {
    try {
      // Use normalizedData here instead of formData
      const normalizedData = {
        payments_main_details_id: formData.payments_main_details_id,
        entries: formData.entries.map((entry) => {
          if (entry.percent_payment_or_not) {
            return {
              ...entry,
              percentage: entry.percentage || 0,
              total_payable: null,
            };
          } else {
            return {
              ...entry,
              percentage: null,
              total_payable: entry.total_payable || 0,
            };
          }
        }),
      };

      await authRequest(
        "post",
        getApiUrl("/api/special-case-payments/bulk"),
        normalizedData // <-- send this instead of formData
      );
      setSuccessMessage("Special case payments submitted successfully.");
      clearForm();
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed.");
      console.error("Submission error:", err);
    }
  };

  // if (reviewMode) {
  //   return (
  //     <div className="mainCostCon">
  //       <div className="review2Con">
  //         <h2>Review Special Case Payments</h2>
  //         <div>
  //           <strong>Payments Main Details ID:</strong>{" "}
  //           {formData.payments_main_details_id}
  //         </div>
  //         <section>
  //           <h3>Entries</h3>
  //           <div className="table-wrapper">
  //             <table>
  //               <thead>
  //                 <tr>
  //                   <th>Title</th>
  //                   <th>Description</th>
  //                   <th>Percent Based?</th>
  //                   <th>Percentage</th>
  //                   <th>Total Payable</th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {formData.entries.map((e, i) => (
  //                   <tr key={i}>
  //                     <td>{e.sc_title}</td>
  //                     <td>{e.description || "-"}</td>
  //                     <td>{e.percent_payment_or_not ? "Yes" : "No"}</td>
  //                     <td>{e.percentage || "-"}</td>
  //                     <td>{e.total_payable || "-"}</td>
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </table>
  //           </div>
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
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Review Special Case Payments
          </h2>

          <div>
            <strong className="text-gray-700">Payments Main Details ID:</strong>{" "}
            <span className="text-gray-800">
              {formData.payments_main_details_id || "-"}
            </span>
          </div>

          <section className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">Entries</h3>
            {formData.entries.length === 0 ? (
              <p className="text-gray-500">
                <em>No entries</em>
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-100 text-gray-800 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Percent Based?</th>
                      <th className="px-4 py-2">Percentage</th>
                      <th className="px-4 py-2">Total Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map((e, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-4 py-2">{e.sc_title || "-"}</td>
                        <td className="px-4 py-2">{e.description || "-"}</td>
                        <td className="px-4 py-2">
                          {e.percent_payment_or_not ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-2">{e.percentage || "-"}</td>
                        <td className="px-4 py-2">{e.total_payable || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setReviewMode(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
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
      </div>
    );
  }

  return (
    // <div className="mainCostCon">
    //   <form onSubmit={handleSubmit} className="aid-request-form-type2">
    //     <h2 className="page-description-type2 h2-type2">
    //       Special Case Payments Entry Form
    //     </h2>

    //     {successMessage && (
    //       <div className="success-popup2">{successMessage}</div>
    //     )}
    //     {error && <div className="error-popup2">{error}</div>}

    //     <div className="step-two-grid aid-request-form-type2">
    //       <div className="form-step">
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
    //           onFocus={() => handleFocus("payments_main_details_id")}
    //           onBlur={() => handleBlur("payments_main_details_id")}
    //           placeholder=" "
    //           required
    //           className="floating-label-input"
    //         />
    //         <label
    //           className={
    //             focused.payments_main_details_id ||
    //             formData.payments_main_details_id
    //               ? "active"
    //               : ""
    //           }
    //         >
    //           Payment Main Details ID
    //         </label>
    //       </div>
    //     </div>
    //     <h2 className="page-description-type2 h2-type2">Entries</h2>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.entries.map((entry, idx) => {
    //         console.log("Value at index", idx, entry.percent_payment_or_not);
    //         return (
    //           <div key={idx} className="dynamic-entry">
    //             <div className="form-step">
    //               <input
    //                 type="text"
    //                 value={entry.sc_title}
    //                 onChange={(e) =>
    //                   handleEntryChange(idx, "sc_title", e.target.value)
    //                 }
    //                 placeholder=" "
    //                 required
    //                 className="floating-label-input"
    //               />
    //               <label className={entry.sc_title ? "active" : ""}>
    //                 Title
    //               </label>
    //             </div>

    //             <div className="form-step">
    //               <textarea
    //                 value={entry.description}
    //                 onChange={(e) =>
    //                   handleEntryChange(idx, "description", e.target.value)
    //                 }
    //                 placeholder=" "
    //                 className="input"
    //                 rows={2}
    //               />
    //               <label className={entry.description ? "active" : ""}>
    //                 Description
    //               </label>
    //             </div>

    //             <div className="form-step">
    //               <Select
    //                 styles={customSelectStyles}
    //                 options={percentPaymentOptions}
    //                 value={
    //                   percentPaymentOptions.find(
    //                     (opt) => opt.value === entry.percent_payment_or_not
    //                   ) || null
    //                 }
    //                 onChange={(selected) =>
    //                   handleEntryChange(
    //                     idx,
    //                     "percent_payment_or_not",
    //                     selected?.value ?? null
    //                   )
    //                 }
    //                 isClearable
    //                 classNamePrefix="react-select"
    //               />
    //               <label className="active2">Percent Payment?</label>
    //             </div>
    //             {entry.percent_payment_or_not ? (
    //               <div className="form-step" key={`percent-${idx}`}>
    //                 <input
    //                   type="number"
    //                   value={entry.percentage}
    //                   onChange={(e) =>
    //                     handleEntryChange(idx, "percentage", e.target.value)
    //                   }
    //                   placeholder=" "
    //                   step="0.01"
    //                   min="0"
    //                   max="100"
    //                   className="floating-label-input"
    //                 />
    //                 <label className={entry.percentage ? "active" : ""}>
    //                   Percentage (%)
    //                 </label>
    //               </div>
    //             ) : (
    //               <div className="form-step" key={`payable-${idx}`}>
    //                 <input
    //                   type="number"
    //                   value={entry.total_payable}
    //                   onChange={(e) =>
    //                     handleEntryChange(idx, "total_payable", e.target.value)
    //                   }
    //                   placeholder=" "
    //                   step="0.01"
    //                   min="0"
    //                   className="floating-label-input"
    //                 />
    //                 <label className={entry.total_payable ? "active" : ""}>
    //                   Total Payable
    //                 </label>
    //               </div>
    //             )}

    //             <div className="pfbtns">
    //               <button
    //                 type="button"
    //                 className="RemAdd"
    //                 onClick={() => removeEntry(idx)}
    //               >
    //                 Remove
    //               </button>
    //             </div>
    //           </div>
    //         );
    //       })}
    //     </div>

    //     <div className="pfbtns">
    //       <button type="button" className="addNew" onClick={addEntry}>
    //         + Add Entry
    //       </button>
    //     </div>

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
          Special Case Payments Entry Form
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

        {/* Payments Main Details ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
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
        </div>

        {/* Entries */}
        <h3 className="text-xl font-semibold text-gray-800">Entries</h3>
        <div className="space-y-4">
          {formData.entries.map((entry, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-4 border border-gray-200 rounded-lg shadow-sm"
            >
              {/* Title */}
              <div className="col-span-1 md:col-span-2">
                <label className="mb-1 text-gray-700 font-medium">Title</label>
                <input
                  type="text"
                  value={entry.sc_title}
                  onChange={(e) =>
                    handleEntryChange(idx, "sc_title", e.target.value)
                  }
                  required
                  className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                         focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                         hover:border-[#01eeff] transition"
                />
              </div>

              {/* Description */}
              <div className="col-span-1 md:col-span-2 h-16">
                <label className="mb-1 text-gray-700 font-medium">
                  Description
                </label>
                <textarea
                  value={entry.description}
                  onChange={(e) =>
                    handleEntryChange(idx, "description", e.target.value)
                  }
                  rows={2}
                  className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5 h-10 
                         focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                         hover:border-[#01eeff] transition"
                />
              </div>

              {/* Percent Payment */}
              <div className="col-span-1 md:col-span-1">
                <label className="mb-1 text-gray-700 font-medium">
                  Percent Payment?
                </label>
                <Select
                  styles={customSelectStyles}
                  options={percentPaymentOptions}
                  value={
                    percentPaymentOptions.find(
                      (opt) => opt.value === entry.percent_payment_or_not
                    ) || null
                  }
                  onChange={(selected) =>
                    handleEntryChange(
                      idx,
                      "percent_payment_or_not",
                      selected?.value ?? null
                    )
                  }
                  isClearable
                  classNamePrefix="react-select"
                />
              </div>

              {/* Percentage or Total Payable */}
              {entry.percent_payment_or_not ? (
                <div className="col-span-1 md:col-span-1">
                  <label className="mb-1 text-gray-700 font-medium">
                    Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={entry.percentage}
                    onChange={(e) =>
                      handleEntryChange(idx, "percentage", e.target.value)
                    }
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition"
                  />
                </div>
              ) : (
                <div className="col-span-1 md:col-span-1">
                  <label className="mb-1 text-gray-700 font-medium">
                    Total Payable
                  </label>
                  <input
                    type="number"
                    value={entry.total_payable}
                    onChange={(e) =>
                      handleEntryChange(idx, "total_payable", e.target.value)
                    }
                    step="0.01"
                    min="0"
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition"
                  />
                </div>
              )}

              {/* Remove Button */}
              <div className="col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Entry */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={addEntry}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            + Add Entry
          </button>
        </div>

        {/* Form Actions */}
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

export default SpecialCasePaymentsForm;
