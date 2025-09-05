import React, { useEffect, useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import { authRequest } from "../../services/authService";
import "./styles/styles.css";
import { getApiUrl } from "../../utils/apiUrl";

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];

const normalizeRoles = (rawRole) => {
  if (!rawRole) return [];
  if (Array.isArray(rawRole)) return rawRole;
  try {
    return JSON.parse(rawRole);
  } catch {
    return [rawRole];
  }
};

const extractPrivilege = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const roles = normalizeRoles(user?.role);
    return roles.some((r) => PRIVILEGED_ROLES.includes(r));
  } catch {
    return false;
  }
};

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

const CourseOverheadsForm = ({
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const DRAFT_KEY = "draftCourseOverheadsForm";

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          payments_main_details_id: "",
          teaching_aids: [],
          training_environments: [],
          overheads: [],
        };
  });

  const [rates, setRates] = useState([]);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await authRequest("get", getApiUrl("/rates"));
        setRates(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Rate fetch failed", err);
        setRates([]);
      }
      setIsPrivileged(extractPrivilege());
    };
    fetchRates();
  }, []);

  const getRate = (desc, category) =>
    rates.find((r) => r.item_description === desc && r.category === category);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateItem = (listName, index, updatedItem) => {
    setFormData((prev) => {
      const updatedList = [...prev[listName]];
      updatedList[index] = updatedItem;
      return { ...prev, [listName]: updatedList };
    });
  };

  const addEntry = (listName, template) => {
    setFormData((prev) => ({
      ...prev,
      [listName]: [...prev[listName], { ...template }],
    }));
  };

  const removeEntry = (listName, index) => {
    setFormData((prev) => {
      const updatedList = [...prev[listName]];
      updatedList.splice(index, 1);
      return { ...prev, [listName]: updatedList };
    });
  };

  const handleTeachingAidChange = (index, field, value) => {
    const item = { ...formData.teaching_aids[index], [field]: value };

    if (field === "item_description") {
      const rate = getRate(value, "Course Delivery (Teaching Aid)");

      // Reset dependent fields on item_description change
      item.required_quantity = "";
      item.required_hours = "";
      item.cost = "";
      if (rate) {
        // Prefill rate for both, but privileged users can overwrite hourly_rate later
        item.hourly_rate = rate.rate;
      } else {
        item.hourly_rate = "";
      }
    }

    const qty = Number(item.required_quantity || 0);
    const hours = Number(item.required_hours || 0);
    let hourlyRate = Number(item.hourly_rate || 0);
    const rate = getRate(
      item.item_description,
      "Course Delivery (Teaching Aid)"
    );

    if (rate) {
      if (rate.rate_type === "Quantity_Hourly") {
        // Require quantity and hours > 0 to calculate cost
        if (qty > 0 && hours > 0) {
          // Privileged users can input hourly_rate, non-privileged get DB rate fixed
          hourlyRate = isPrivileged ? hourlyRate || rate.rate : rate.rate;
          item.hourly_rate = hourlyRate;
          item.cost = qty * hours * hourlyRate;
        } else {
          item.cost = "";
        }
      } else if (rate.rate_type === "Full Payment") {
        if (qty > 0 && hours > 0) {
          if (isPrivileged) {
            // Privileged can calculate cost from inputs
            hourlyRate = hourlyRate || rate.rate;
            item.hourly_rate = hourlyRate;
            item.cost = qty * hours * hourlyRate;
          } else {
            // Non-privileged cost is fixed rate
            item.cost = rate.rate;
            item.hourly_rate = rate.rate;
          }
        } else {
          // item.cost = "";
        }
      } else {
        // Unsupported rate type, clear cost
        item.cost = "";
      }
    } else {
      // Rate not found: user must provide cost explicitly (do not auto-calc)
      item.cost = item.cost || "";
    }

    updateItem("teaching_aids", index, item);
  };

  const handleTrainingEnvChange = (index, field, value) => {
    const item = { ...formData.training_environments[index], [field]: value };

    if (field === "item_description") {
      const rate = getRate(value, "Course Delivery (Teaching Env)");
      item.required_hours = "";
      item.cost = "";
      if (rate) {
        item.hourly_rate = rate.rate;
      } else {
        item.hourly_rate = "";
      }
    }

    const hours = Number(item.required_hours || 0);
    let hourlyRate = Number(item.hourly_rate || 0);
    const rate = getRate(
      item.item_description,
      "Course Delivery (Teaching Env)"
    );

    if (rate?.rate_type === "Hourly") {
      if (hours > 0) {
        hourlyRate = isPrivileged ? hourlyRate || rate.rate : rate.rate;
        item.hourly_rate = hourlyRate;
        item.cost = hourlyRate * hours;
      } else {
        item.cost = "";
      }
    } else {
      // No rate: cost must be provided or calc from hourlyRate * hours
      if (!rate && hours > 0 && !isNaN(hourlyRate)) {
        item.cost = hourlyRate * hours;
      } else {
        item.cost = "";
      }
    }

    updateItem("training_environments", index, item);
  };

  const handleOverheadChange = (index, field, value) => {
    const item = { ...formData.overheads[index], [field]: value };

    if (field === "item_description") {
      const rate = getRate(value, "Overheads");
      item.required_quantity = "";
      item.cost = "";
      if (rate) {
        item.rate = rate.rate;
      } else {
        item.rate = "";
      }
    }

    const qty = Number(item.required_quantity || 0);
    let rateValue = Number(item.rate || 0);
    const rate = getRate(item.item_description, "Overheads");

    if (rate) {
      if (rate.rate_type === "Quantity") {
        if (qty > 0) {
          rateValue = isPrivileged ? rateValue || rate.rate : rate.rate;
          item.rate = rateValue;
          item.cost = rateValue * qty;
        } else {
          item.cost = "";
        }
      } else if (rate.rate_type === "Full Payment") {
        if (qty > 0) {
          if (isPrivileged) {
            // Use rateValue as is (even if empty or zero)
            item.rate = rateValue;

            // If user manually entered cost (non-empty and valid number), use it
            if (
              typeof item.cost === "number" &&
              !isNaN(item.cost) &&
              item.cost >= 0
            ) {
              // Use provided cost directly
            } else {
              // Otherwise calculate cost from rate and qty if rate is positive
              item.cost = rateValue > 0 ? qty * rateValue : "";
            }
          } else {
            // Non-privileged user: fixed cost and rate from DB rate
            item.cost = rate.rate;
            item.rate = rate.rate;
          }
        } else {
        }
      }
    } else {
      // No rate found
      if (isPrivileged) {
        // Privileged can provide cost or calculate cost if both rate & quantity given
        if (qty > 0 && rateValue > 0) {
          item.cost = rateValue * qty;
        } else {
          item.cost = item.cost || "";
        }
      } else {
        // Non-privileged must provide cost explicitly
        item.cost = item.cost || "";
      }
    }

    updateItem("overheads", index, item);
  };

  const handleFinalSubmit = async () => {
    const payload = {
      payments_main_details_id: Number(formData.payments_main_details_id),
      teaching_aids: formData.teaching_aids.map((item) => ({
        ...item,
        required_quantity: item.required_quantity
          ? Number(item.required_quantity)
          : undefined,
        required_hours: item.required_hours
          ? Number(item.required_hours)
          : undefined,
        hourly_rate: item.hourly_rate ? Number(item.hourly_rate) : undefined,
        cost: item.cost ? Number(item.cost) : undefined,
      })),
      training_environments: formData.training_environments.map((item) => ({
        ...item,
        required_hours: item.required_hours
          ? Number(item.required_hours)
          : undefined,
        hourly_rate: item.hourly_rate ? Number(item.hourly_rate) : undefined,
        cost: item.cost ? Number(item.cost) : undefined,
      })),
      overheads: formData.overheads.map((item) => ({
        ...item,
        required_quantity: item.required_quantity
          ? Number(item.required_quantity)
          : undefined,
        rate: item.rate ? Number(item.rate) : undefined,
        cost: item.cost ? Number(item.cost) : undefined,
      })),
    };

    try {
      await authRequest(
        "post",
        getApiUrl("/course-overheads-cost/full"),
        payload
      );
      setSuccessMessage("Course overheads submitted successfully.");
      setError(null);
      setFormData({
        payments_main_details_id: "",
        teaching_aids: [],
        training_environments: [],
        overheads: [],
      });
      setReviewMode(false);
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.response?.data?.error || "Submission failed.");
      setSuccessMessage(null);
      setReviewMode(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setReviewMode(true);
    setSuccessMessage(null);
    setError(null);
  };

  const handleClearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({
      payments_main_details_id: "",
      teaching_aids: [],
      training_environments: [],
      overheads: [],
    });
  };

  const rateOptions = useMemo(() => {
    const grouped = {};
    for (const r of rates) {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push({
        label: r.item_description,
        value: r.item_description,
      });
    }
    return grouped;
  }, [rates]);

  // if (reviewMode) {
  //   // Define columns order based on your DB table schemas
  //   const columnsBySection = {
  //     "Teaching Aids": [
  //       "item_description",
  //       "required_quantity",
  //       "required_hours",
  //       "hourly_rate",
  //       "cost",
  //     ],
  //     "Training Environments": [
  //       "item_description",
  //       "required_hours",
  //       "hourly_rate",
  //       "cost",
  //     ],
  //     Overheads: ["item_description", "required_quantity", "rate", "cost"],
  //   };

  //   return (
  //     <div className="mainCostCon">
  //       <div className="review2Con">
  //         <h2>Review Your Course Overheads Submission</h2>

  //         <div>
  //           <strong>Payments Main Details ID:</strong>{" "}
  //           {formData.payments_main_details_id || <em>Not Provided</em>}
  //         </div>

  //         {[
  //           { title: "Teaching Aids", data: formData.teaching_aids },
  //           {
  //             title: "Training Environments",
  //             data: formData.training_environments,
  //           },
  //           { title: "Overheads", data: formData.overheads },
  //         ].map(({ title, data }) => {
  //           const columns =
  //             columnsBySection[title] || (data[0] ? Object.keys(data[0]) : []);

  //           return (
  //             <section key={title}>
  //               <h3>{title}</h3>
  //               {data.length === 0 ? (
  //                 <p>
  //                   <em>No entries</em>
  //                 </p>
  //               ) : (
  //                 <div className="table-wrapper">
  //                   <table>
  //                     <thead>
  //                       <tr>
  //                         {columns.map((col) => (
  //                           <th key={col}>
  //                             {col
  //                               .replace(/_/g, " ")
  //                               .replace(/\b\w/g, (c) => c.toUpperCase())}
  //                           </th>
  //                         ))}
  //                       </tr>
  //                     </thead>
  //                     <tbody>
  //                       {data.map((item, idx) => (
  //                         <tr key={idx}>
  //                           {columns.map((col) => (
  //                             <td key={col}>
  //                               {item[col] === undefined || item[col] === "" ? (
  //                                 <em>N/A</em>
  //                               ) : (
  //                                 item[col].toString()
  //                               )}
  //                             </td>
  //                           ))}
  //                         </tr>
  //                       ))}
  //                     </tbody>
  //                   </table>
  //                 </div>
  //               )}
  //             </section>
  //           );
  //         })}

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
    const columnsBySection = {
      "Teaching Aids": [
        "item_description",
        "required_quantity",
        "required_hours",
        "hourly_rate",
        "cost",
      ],
      "Training Environments": [
        "item_description",
        "required_hours",
        "hourly_rate",
        "cost",
      ],
      Overheads: ["item_description", "required_quantity", "rate", "cost"],
    };

    return (
      <div className="space-y-6 w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Review Your Course Overheads Submission
        </h2>

        <div className="text-gray-700 mb-6">
          <strong>Payments Main Details ID:</strong>{" "}
          {formData.payments_main_details_id || <em>Not Provided</em>}
        </div>

        {[
          { title: "Teaching Aids", data: formData.teaching_aids },
          {
            title: "Training Environments",
            data: formData.training_environments,
          },
          { title: "Overheads", data: formData.overheads },
        ].map(({ title, data }) => {
          const columns =
            columnsBySection[title] || (data[0] ? Object.keys(data[0]) : []);

          return (
            <section key={title} className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">{title}</h3>

              {data.length === 0 ? (
                <p className="text-gray-500">
                  <em>No entries</em>
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-100 text-gray-800 font-semibold">
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="px-4 py-2">
                            {col
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          {columns.map((col) => (
                            <td key={col} className="px-4 py-2">
                              {item[col] === undefined || item[col] === "" ? (
                                <em>N/A</em>
                              ) : (
                                item[col].toString()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}

        <div className="flex justify-end gap-3 mt-6">
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
    //       Fill Out The Course Overheads{" "}
    //       {isPrivileged && <span style={{ color: "cyan" }}>(PRIVILEGED)</span>}
    //     </h2>

    //     {successMessage && (
    //       <div className="success-popup2">{successMessage}</div>
    //     )}
    //     {error && <div className="error-popup2">{error}</div>}

    //     <div className="aid-request-form-type2">
    //       <div className="step-two-grid aid-request-form-type2">
    //         <div className="form-step">
    //           <input
    //             type="number"
    //             name="payments_main_details_id"
    //             value={formData.payments_main_details_id}
    //             onChange={handleChange}
    //             required
    //             placeholder=" "
    //             className="input"
    //           />
    //           <label
    //             className={formData.payments_main_details_id ? "active2" : ""}
    //           >
    //             Payments Main Details ID
    //           </label>
    //         </div>
    //       </div>
    //     </div>

    //     <h3 className="page-description-type2 h2-type2">Teaching Aids</h3>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.teaching_aids.map((item, idx) => (
    //         <div key={idx} className="expense-entry">
    //           <div className="form-step">
    //             <CreatableSelect
    //               styles={customSelectStyles}
    //               classNamePrefix="custom-select"
    //               placeholder=" "
    //               value={
    //                 item.item_description
    //                   ? {
    //                       label: item.item_description,
    //                       value: item.item_description,
    //                     }
    //                   : null
    //               }
    //               onChange={(opt) =>
    //                 handleTeachingAidChange(
    //                   idx,
    //                   "item_description",
    //                   opt?.value || ""
    //                 )
    //               }
    //               options={rateOptions["Course Delivery (Teaching Aid)"] || []}
    //               isClearable
    //             />
    //             <label className={item.item_description ? "active2" : ""}>
    //               Item Description
    //             </label>
    //           </div>

    //           {[
    //             "required_quantity",
    //             "required_hours",
    //             "hourly_rate",
    //             "cost",
    //           ].map((field, i) => (
    //             <div className="form-step" key={i}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={item[field] || ""}
    //                 onChange={(e) =>
    //                   handleTeachingAidChange(idx, field, e.target.value)
    //                 }
    //                 readOnly={
    //                   field === "hourly_rate" &&
    //                   !isPrivileged &&
    //                   getRate(
    //                     item.item_description,
    //                     "Course Delivery (Teaching Aid)"
    //                   )
    //                 }
    //                 className="input"
    //               />
    //               <label className={item[field] ? "active2" : ""}>
    //                 {field
    //                   .replace("_", " ")
    //                   .replace("required ", "")
    //                   .replace("hourly", "Hourly")
    //                   .replace("rate", "Rate")
    //                   .replace("cost", "Cost")}
    //               </label>
    //             </div>
    //           ))}

    //           <div className="pfbtns">
    //             <button
    //               type="button"
    //               className="RemAdd"
    //               onClick={() => removeEntry("teaching_aids", idx)}
    //             >
    //               Remove
    //             </button>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //     <div className="pfbtns">
    //       <button
    //         type="button"
    //         className="addNew"
    //         onClick={() => addEntry("teaching_aids", {})}
    //       >
    //         + Add Teaching Aid
    //       </button>
    //     </div>

    //     <h3 className="page-description-type2 h2-type2">
    //       Training Environments
    //     </h3>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.training_environments.map((item, idx) => (
    //         <div key={idx} className="expense-entry">
    //           <div className="form-step">
    //             <CreatableSelect
    //               styles={customSelectStyles}
    //               classNamePrefix="custom-select"
    //               placeholder=" "
    //               value={
    //                 item.item_description
    //                   ? {
    //                       label: item.item_description,
    //                       value: item.item_description,
    //                     }
    //                   : null
    //               }
    //               onChange={(opt) =>
    //                 handleTrainingEnvChange(
    //                   idx,
    //                   "item_description",
    //                   opt?.value || ""
    //                 )
    //               }
    //               options={rateOptions["Course Delivery (Teaching Env)"] || []}
    //               isClearable
    //             />
    //             <label className={item.item_description ? "active2" : ""}>
    //               Item Description
    //             </label>
    //           </div>

    //           {["required_hours", "hourly_rate", "cost"].map((field, i) => (
    //             <div className="form-step" key={i}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={item[field] || ""}
    //                 onChange={(e) =>
    //                   handleTrainingEnvChange(idx, field, e.target.value)
    //                 }
    //                 readOnly={
    //                   field === "hourly_rate" &&
    //                   !isPrivileged &&
    //                   getRate(
    //                     item.item_description,
    //                     "Course Delivery (Teaching Env)"
    //                   )
    //                 }
    //                 className="input"
    //               />
    //               <label className={item[field] ? "active2" : ""}>
    //                 {field
    //                   .replace("_", " ")
    //                   .replace("required ", "")
    //                   .replace("hourly", "Hourly")
    //                   .replace("rate", "Rate")
    //                   .replace("cost", "Cost")}
    //               </label>
    //             </div>
    //           ))}

    //           <div className="pfbtns">
    //             <button
    //               type="button"
    //               className="RemAdd"
    //               onClick={() => removeEntry("training_environments", idx)}
    //             >
    //               Remove
    //             </button>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //     <div className="pfbtns">
    //       <button
    //         type="button"
    //         className="addNew"
    //         onClick={() => addEntry("training_environments", {})}
    //       >
    //         + Add Training Environment
    //       </button>
    //     </div>

    //     <h3 className="page-description-type2 h2-type2">Overheads</h3>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.overheads.map((item, idx) => (
    //         <div key={idx} className="expense-entry">
    //           <div className="form-step">
    //             <CreatableSelect
    //               styles={customSelectStyles}
    //               classNamePrefix="custom-select"
    //               placeholder=" "
    //               value={
    //                 item.item_description
    //                   ? {
    //                       label: item.item_description,
    //                       value: item.item_description,
    //                     }
    //                   : null
    //               }
    //               onChange={(opt) =>
    //                 handleOverheadChange(
    //                   idx,
    //                   "item_description",
    //                   opt?.value || ""
    //                 )
    //               }
    //               options={rateOptions["Overheads"] || []}
    //               isClearable
    //             />
    //             <label className={item.item_description ? "active2" : ""}>
    //               Item Description
    //             </label>
    //           </div>

    //           {["required_quantity", "rate", "cost"].map((field, i) => (
    //             <div className="form-step" key={i}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={item[field] || ""}
    //                 onChange={(e) =>
    //                   handleOverheadChange(idx, field, e.target.value)
    //                 }
    //                 readOnly={
    //                   field === "rate" &&
    //                   !isPrivileged &&
    //                   getRate(item.item_description, "Overheads")
    //                 }
    //                 className="input"
    //               />
    //               <label className={item[field] ? "active2" : ""}>
    //                 {field.charAt(0).toUpperCase() + field.slice(1)}
    //               </label>
    //             </div>
    //           ))}

    //           <div className="pfbtns">
    //             <button
    //               type="button"
    //               className="RemAdd"
    //               onClick={() => removeEntry("overheads", idx)}
    //             >
    //               Remove
    //             </button>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //     <div className="pfbtns">
    //       <button
    //         type="button"
    //         className="addNew"
    //         onClick={() => addEntry("overheads", {})}
    //       >
    //         + Add Overhead
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
    //         <button type="button" className="ccfbtn" onClick={handleClearForm}>
    //           Clear Form
    //         </button>
    //       </div>
    //     </div>
    //   </form>
    // </div>

    <div className="space-y-6 w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Fill Out The Course Overheads{" "}
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
              onChange={handleChange}
              required
              min={1}
              className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                     focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                     hover:border-[#01eeff] transition"
            />
          </div>
        </div>

        {/* Teaching Aids */}
        <h3 className="text-xl font-semibold text-gray-800">Teaching Aids</h3>
        <div className="space-y-4">
          {formData.teaching_aids.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
            >
              {/* Item Description */}
              <div className="col-span-2">
                <label className="mb-1 text-gray-700 font-medium">
                  Item Description
                </label>
                <CreatableSelect
                  styles={customSelectStyles}
                  placeholder=" "
                  value={
                    item.item_description
                      ? {
                          label: item.item_description,
                          value: item.item_description,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    handleTeachingAidChange(
                      idx,
                      "item_description",
                      opt?.value || ""
                    )
                  }
                  options={rateOptions["Course Delivery (Teaching Aid)"] || []}
                  isClearable
                  isSearchable
                />
              </div>

              {/* Numeric Fields */}
              {[
                "required_quantity",
                "required_hours",
                "hourly_rate",
                "cost",
              ].map((field, i) => (
                <div key={i}>
                  <label className="mb-1 text-gray-700 font-medium">
                    {field
                      .replace("_", " ")
                      .replace("required ", "")
                      .replace("hourly", "Hourly")
                      .replace("rate", "Rate")
                      .replace("cost", "Cost")}
                  </label>
                  <input
                    type="number"
                    value={item[field] || ""}
                    onChange={(e) =>
                      handleTeachingAidChange(idx, field, e.target.value)
                    }
                    readOnly={
                      field === "hourly_rate" &&
                      !isPrivileged &&
                      getRate(
                        item.item_description,
                        "Course Delivery (Teaching Aid)"
                      )
                    }
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                             focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                             hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>
              ))}

              <div>
                <button
                  type="button"
                  onClick={() => removeEntry("teaching_aids", idx)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addEntry("teaching_aids", {})}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            + Add Teaching Aid
          </button>
        </div>

        {/* Training Environments */}
        <h3 className="text-xl font-semibold text-gray-800">
          Training Environments
        </h3>
        <div className="space-y-4">
          {formData.training_environments.map((item, idx) => (
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
                    item.item_description
                      ? {
                          label: item.item_description,
                          value: item.item_description,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    handleTrainingEnvChange(
                      idx,
                      "item_description",
                      opt?.value || ""
                    )
                  }
                  options={rateOptions["Course Delivery (Teaching Env)"] || []}
                  isClearable
                  isSearchable
                />
              </div>

              {["required_hours", "hourly_rate", "cost"].map((field, i) => (
                <div key={i}>
                  <label className="mb-1 text-gray-700 font-medium">
                    {field
                      .replace("_", " ")
                      .replace("required ", "")
                      .replace("hourly", "Hourly")
                      .replace("rate", "Rate")
                      .replace("cost", "Cost")}
                  </label>
                  <input
                    type="number"
                    value={item[field] || ""}
                    onChange={(e) =>
                      handleTrainingEnvChange(idx, field, e.target.value)
                    }
                    readOnly={
                      field === "hourly_rate" &&
                      !isPrivileged &&
                      getRate(
                        item.item_description,
                        "Course Delivery (Teaching Env)"
                      )
                    }
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>
              ))}

              <div>
                <button
                  type="button"
                  onClick={() => removeEntry("training_environments", idx)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addEntry("training_environments", {})}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            + Add Training Environment
          </button>
        </div>

        {/* Overheads */}
        <h3 className="text-xl font-semibold text-gray-800">Overheads</h3>
        <div className="space-y-4">
          {formData.overheads.map((item, idx) => (
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
                    item.item_description
                      ? {
                          label: item.item_description,
                          value: item.item_description,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    handleOverheadChange(
                      idx,
                      "item_description",
                      opt?.value || ""
                    )
                  }
                  options={rateOptions["Overheads"] || []}
                  isClearable
                  isSearchable
                />
              </div>

              {["required_quantity", "rate", "cost"].map((field, i) => (
                <div key={i}>
                  <label className="mb-1 text-gray-700 font-medium">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="number"
                    value={item[field] || ""}
                    onChange={(e) =>
                      handleOverheadChange(idx, field, e.target.value)
                    }
                    readOnly={
                      field === "rate" &&
                      !isPrivileged &&
                      getRate(item.item_description, "Overheads")
                    }
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>
              ))}

              <div>
                <button
                  type="button"
                  onClick={() => removeEntry("overheads", idx)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addEntry("overheads", {})}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            + Add Overhead
          </button>
        </div>

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
            onClick={handleClearForm}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseOverheadsForm;
