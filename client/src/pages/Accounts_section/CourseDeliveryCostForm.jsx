import React, { useEffect, useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { getApiUrl } from "../../utils/apiUrl";
import { authRequest } from "../../services/authService";
import "./styles/styles.css";

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];
const HR_CATEGORY = "Course Delivery Human Resources";
const MATERIALS_CATEGORY = "Course Delivery (Materials)";

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
    const user = JSON.parse(userString);
    const roles = normalizeRoles(user?.role);
    return roles.some((r) => PRIVILEGED_ROLES.includes(r));
  } catch {
    return false;
  }
};

const CourseDeliveryCostForm = ({
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const DRAFT_KEY = "draftCourseDeliveryCostForm";

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          payments_main_details_id: "",
          Md_approval_obtained: null,
          Md_details: null,
          cost_items: [],
          materials: [],
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

  const getRateInfo = (desc, category) => {
    return rates.find(
      (r) =>
        r.item_description.toLowerCase() === desc?.toLowerCase() &&
        r.category === category
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateCostItem = (index, updated) => {
    const updatedList = [...formData.cost_items];
    updatedList[index] = updated;
    setFormData((prev) => ({ ...prev, cost_items: updatedList }));
  };

  const updateMaterial = (index, updated) => {
    const updatedList = [...formData.materials];
    updatedList[index] = updated;
    setFormData((prev) => ({ ...prev, materials: updatedList }));
  };

  const hrOptions = useMemo(() => {
    return rates
      .filter((r) => r.category === HR_CATEGORY)
      .map((r) => ({ label: r.item_description, value: r.item_description }));
  }, [rates]);

  const materialOptions = useMemo(() => {
    return rates
      .filter((r) => r.category === MATERIALS_CATEGORY)
      .map((r) => ({ label: r.item_description, value: r.item_description }));
  }, [rates]);

  const handleCostItemChange = (index, field, value) => {
    let updated = { ...formData.cost_items[index], [field]: value };
    const rateEntry = getRateInfo(updated.role, HR_CATEGORY);

    if (field === "role") {
      // Reset related fields on role change
      updated.no_of_officers = "";
      updated.hours = "";
      updated.amount = "";
      updated.rate = rateEntry ? (isPrivileged ? "" : rateEntry.rate) : "";
    }

    const officers = Number(updated.no_of_officers);
    const hours = Number(updated.hours);
    let rate = Number(updated.rate);

    if (field === "role") {
      // When role changes, reset rate to rateEntry rate if exists (unless privileged users want to keep manual)
      if (rateEntry) {
        if (!isPrivileged) {
          updated.rate = rateEntry.rate;
          rate = rateEntry.rate;
        } else if (updated.rate === "" || isNaN(rate)) {
          // For privileged, if no rate set, prefill rate
          updated.rate = rateEntry.rate;
          rate = rateEntry.rate;
        }
      } else {
        // No rateEntry found, do not override rate field for privileged or non-privileged
      }
    }

    if (rateEntry) {
      if (rateEntry.rate_type === "Hourly") {
        if (!isPrivileged) updated.rate = rateEntry.rate; // lock rate for non-privileged
        if (!isNaN(officers) && !isNaN(hours)) {
          updated.amount =
            (isPrivileged ? rate : rateEntry.rate) * officers * hours;
        }
      }
    } else if (
      isPrivileged &&
      !isNaN(officers) &&
      !isNaN(hours) &&
      !isNaN(rate)
    ) {
      updated.amount = rate * officers * hours;
    }

    updateCostItem(index, updated);
  };

  const handleMaterialChange = (index, field, value) => {
    let updatedItem = { ...formData.materials[index], [field]: value };

    const rateEntry = getRateInfo(
      updatedItem.item_description,
      MATERIALS_CATEGORY
    );

    // Reset dependent fields on item_description change
    if (field === "item_description") {
      updatedItem.required_quantity = "";
      updatedItem.rate = rateEntry ? rateEntry.rate : ""; // Prefill rate
      updatedItem.cost = "";
    }

    // Safely convert to numbers
    const qty =
      updatedItem.required_quantity !== ""
        ? Number(updatedItem.required_quantity)
        : NaN;
    const rate = updatedItem.rate !== "" ? Number(updatedItem.rate) : NaN;

    if (rateEntry) {
      if (!isPrivileged) {
        if (rateEntry.rate_type === "Quantity") {
          updatedItem.cost = !isNaN(qty) ? rateEntry.rate * qty : "";
        } else if (rateEntry.rate_type === "Full Payment") {
          // Allow user to enter cost manually; do not auto-calculate or override
          // Only calculate if quantity is given and cost is not yet filled
          if (
            (updatedItem.cost === "" || isNaN(Number(updatedItem.cost))) &&
            !isNaN(qty)
          ) {
            updatedItem.cost = rateEntry.rate * qty;
          }
        }
      } else {
        // Privileged users can edit freely
        if (rateEntry.rate_type === "Quantity" && !isNaN(qty) && !isNaN(rate)) {
          updatedItem.cost = rate * qty;
        } else if (
          rateEntry.rate_type === "Full Payment" &&
          (updatedItem.cost === "" || isNaN(Number(updatedItem.cost))) &&
          !isNaN(qty) &&
          !isNaN(rate)
        ) {
          updatedItem.cost = rate * qty;
        }
        // Otherwise leave cost as manually entered
      }
    } else {
      // No rate entry in DB
      if (!isNaN(qty) && !isNaN(rate)) {
        updatedItem.cost = rate * qty;
      }
    }

    updateMaterial(index, updatedItem);
  };

  const addCostItem = () => {
    setFormData((prev) => ({
      ...prev,
      cost_items: [
        ...prev.cost_items,
        { role: "", no_of_officers: "", hours: "", rate: "", amount: "" },
      ],
    }));
  };

  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { item_description: "", required_quantity: "", rate: "", cost: "" },
      ],
    }));
  };

  const removeCostItem = (index) => {
    setFormData((prev) => {
      const updated = [...prev.cost_items];
      updated.splice(index, 1);
      return { ...prev, cost_items: updated };
    });
  };

  const removeMaterial = (index) => {
    setFormData((prev) => {
      const updated = [...prev.materials];
      updated.splice(index, 1);
      return { ...prev, materials: updated };
    });
  };

  const clearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({
      payments_main_details_id: "",
      Md_approval_obtained: "",
      Md_details: "",
      cost_items: [],
      materials: [],
    });
  };

  // Rename your existing handleSubmit to handleFinalSubmit
  const handleFinalSubmit = async () => {
    const payload = {
      payments_main_details_id: Number(formData.payments_main_details_id),
      Md_approval_obtained: formData.Md_approval_obtained,
      Md_details: formData.Md_details,
      cost_items: formData.cost_items.map((i) => ({
        role: i.role,
        no_of_officers: i.no_of_officers ? Number(i.no_of_officers) : undefined,
        hours: i.hours ? Number(i.hours) : undefined,
        rate: i.rate ? Number(i.rate) : undefined,
        amount: i.amount ? Number(i.amount) : undefined,
      })),
      materials: formData.materials.map((m) => ({
        item_description: m.item_description,
        required_quantity: m.required_quantity
          ? Number(m.required_quantity)
          : undefined,
        rate: m.rate ? Number(m.rate) : undefined,
        cost: m.cost ? Number(m.cost) : undefined,
      })),
    };

    try {
      await authRequest(
        "post",
        getApiUrl("/course-delivery-cost-full/full"),
        payload
      );
      setSuccessMessage("Course delivery costs submitted successfully.");
      clearForm();
      setReviewMode(false); // Return to edit mode after submit
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Submission failed.");
      setReviewMode(false);
    }
  };

  // New handleSubmit just toggles review mode
  const handleSubmit = (e) => {
    e.preventDefault();
    setReviewMode(true);
  };

  // if (reviewMode) {
  //   return (
  //     <div className="mainCostCon">
  //       <div className="review2Con">
  //         <h2>Review Course Delivery Costs</h2>

  //         {/* Main Details */}
  //         <section>
  //           <h3>Main Details</h3>
  //           <div>
  //             <strong>Payments Main Details ID:</strong>{" "}
  //             {formData.payments_main_details_id || <em>Not Provided</em>}
  //           </div>
  //           <div>
  //             <strong>MD Approval Obtained:</strong>{" "}
  //             {formData.Md_approval_obtained || <em>Not Provided</em>}
  //           </div>
  //           <div>
  //             <strong>MD Details:</strong>{" "}
  //             {formData.Md_details || <em>Not Provided</em>}
  //           </div>
  //         </section>

  //         {/* Cost Items */}
  //         <section>
  //           <h3>Human Resource Cost Items</h3>
  //           {formData.cost_items.length === 0 ? (
  //             <p>
  //               <em>No cost items added.</em>
  //             </p>
  //           ) : (
  //             <div className="table-wrapper">
  //               <table>
  //                 <thead>
  //                   <tr>
  //                     <th>Role</th>
  //                     <th>No. of Officers</th>
  //                     <th>Hours</th>
  //                     <th>Rate</th>
  //                     <th>Amount</th>
  //                   </tr>
  //                 </thead>
  //                 <tbody>
  //                   {formData.cost_items.map((item, idx) => (
  //                     <tr key={idx}>
  //                       <td>{item.role || <em>N/A</em>}</td>
  //                       <td>{item.no_of_officers ?? <em>N/A</em>}</td>
  //                       <td>{item.hours ?? <em>N/A</em>}</td>
  //                       <td>{item.rate ?? <em>N/A</em>}</td>
  //                       <td>{item.amount ?? <em>N/A</em>}</td>
  //                     </tr>
  //                   ))}
  //                 </tbody>
  //               </table>
  //             </div>
  //           )}
  //         </section>

  //         {/* Materials */}
  //         <section>
  //           <h3>Materials</h3>
  //           {formData.materials.length === 0 ? (
  //             <p>
  //               <em>No materials added.</em>
  //             </p>
  //           ) : (
  //             <div className="table-wrapper">
  //               <table>
  //                 <thead>
  //                   <tr>
  //                     <th>Item Description</th>
  //                     <th>Required Quantity</th>
  //                     <th>Rate</th>
  //                     <th>Cost</th>
  //                   </tr>
  //                 </thead>
  //                 <tbody>
  //                   {formData.materials.map((mat, idx) => (
  //                     <tr key={idx}>
  //                       <td>{mat.item_description || <em>N/A</em>}</td>
  //                       <td>{mat.required_quantity ?? <em>N/A</em>}</td>
  //                       <td>{mat.rate ?? <em>N/A</em>}</td>
  //                       <td>{mat.cost ?? <em>N/A</em>}</td>
  //                     </tr>
  //                   ))}
  //                 </tbody>
  //               </table>
  //             </div>
  //           )}
  //         </section>

  //         {/* Buttons */}
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
          Review Course Delivery Costs
        </h2>

        {/* Main Details */}
        <section className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Main Details</h3>
          <div className="text-gray-700">
            <strong>Payments Main Details ID:</strong>{" "}
            {formData.payments_main_details_id || <em>Not Provided</em>}
          </div>
          <div className="text-gray-700">
            <strong>MD Approval Obtained:</strong>{" "}
            {formData.Md_approval_obtained || <em>Not Provided</em>}
          </div>
          <div className="text-gray-700">
            <strong>MD Details:</strong>{" "}
            {formData.Md_details || <em>Not Provided</em>}
          </div>
        </section>

        {/* Cost Items */}
        <section className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">
            Human Resource Cost Items
          </h3>
          {formData.cost_items.length === 0 ? (
            <p className="text-gray-500">
              <em>No cost items added.</em>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 text-gray-800 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">No. of Officers</th>
                    <th className="px-4 py-2">Hours</th>
                    <th className="px-4 py-2">Rate</th>
                    <th className="px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.cost_items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.role || <em>N/A</em>}</td>
                      <td className="px-4 py-2">
                        {item.no_of_officers ?? <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">
                        {item.hours ?? <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">{item.rate ?? <em>N/A</em>}</td>
                      <td className="px-4 py-2">
                        {item.amount ?? <em>N/A</em>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Materials */}
        <section className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Materials</h3>
          {formData.materials.length === 0 ? (
            <p className="text-gray-500">
              <em>No materials added.</em>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 text-gray-800 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Item Description</th>
                    <th className="px-4 py-2">Required Quantity</th>
                    <th className="px-4 py-2">Rate</th>
                    <th className="px-4 py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.materials.map((mat, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">
                        {mat.item_description || <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">
                        {mat.required_quantity ?? <em>N/A</em>}
                      </td>
                      <td className="px-4 py-2">{mat.rate ?? <em>N/A</em>}</td>
                      <td className="px-4 py-2">{mat.cost ?? <em>N/A</em>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Buttons */}
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
    //       Fill Out The Course Delivery Costs{" "}
    //       {isPrivileged && <span style={{ color: "cyan" }}>(PRIVILEGED)</span>}
    //     </h2>

    //     {successMessage && (
    //       <div className="success-popup2">{successMessage}</div>
    //     )}
    //     {error && <div className="error-popup2">{error}</div>}

    //     <div className="step-two-grid aid-request-form-type2">
    //       {/* Payments Main Details ID */}
    //       <div className="form-step">
    //         <input
    //           type="number"
    //           name="payments_main_details_id"
    //           value={formData.payments_main_details_id}
    //           onChange={handleChange}
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

    //       <div className="form-step">
    //         <Select
    //           styles={customSelectStyles}
    //           name="Md_approval_obtained"
    //           options={[
    //             { value: "Pending", label: "Pending" },
    //             { value: "Approved", label: "Approved" },
    //             { value: "Denied", label: "Denied" },
    //           ]}
    //           value={
    //             formData.Md_approval_obtained
    //               ? {
    //                   value: formData.Md_approval_obtained,
    //                   label: formData.Md_approval_obtained,
    //                 }
    //               : null
    //           }
    //           onChange={(selected) =>
    //             handleChange({
    //               target: {
    //                 name: "Md_approval_obtained",
    //                 value: selected?.value || "",
    //               },
    //             })
    //           }
    //           onFocus={() => onFocus("Md_approval_obtained")}
    //           onBlur={() => onBlur("Md_approval_obtained")}
    //           placeholder=" "
    //           isClearable
    //         />
    //         <label
    //           className={
    //             focused.Md_approval_obtained || formData.Md_approval_obtained
    //               ? "active2"
    //               : ""
    //           }
    //         >
    //           MD Approval Obtained
    //         </label>
    //       </div>

    //       {/* MD Details */}
    //       <div className="form-step">
    //         <textarea
    //           className="input"
    //           name="Md_details"
    //           value={formData.Md_details}
    //           onChange={handleChange}
    //           placeholder=" "
    //           onFocus={() => onFocus("Md_details")}
    //           onBlur={() => onBlur("Md_details")}
    //         />
    //         <label
    //           className={
    //             focused.Md_details || formData.Md_details ? "active2" : ""
    //           }
    //         >
    //           MD Details
    //         </label>
    //       </div>
    //     </div>

    //     <h3 className="page-description-type2 h2-type2">
    //       Human Resource Cost Items
    //     </h3>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.cost_items.map((item, idx) => {
    //         const rateEntry = getRateInfo(item.role, HR_CATEGORY);
    //         const rateLocked = !!rateEntry && !isPrivileged;
    //         return (
    //           <div key={idx} className="expense-entry">
    //             <div className="form-step" style={{ flex: 2 }}>
    //               <Select
    //                 classNamePrefix="custom-select"
    //                 placeholder=" "
    //                 value={
    //                   item.role ? { label: item.role, value: item.role } : null
    //                 }
    //                 onChange={(option) =>
    //                   handleCostItemChange(idx, "role", option?.value || "")
    //                 }
    //                 options={hrOptions}
    //                 isClearable
    //                 isSearchable
    //               />
    //               <label className={item.role ? "active2" : ""}>Role</label>
    //             </div>

    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={item.no_of_officers}
    //                 onChange={(e) =>
    //                   handleCostItemChange(
    //                     idx,
    //                     "no_of_officers",
    //                     e.target.value
    //                   )
    //                 }
    //                 min={0}
    //                 className="input"
    //                 onFocus={() => onFocus(`hr_off_${idx}`)}
    //                 onBlur={() => onBlur(`hr_off_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`hr_off_${idx}`] || item.no_of_officers
    //                     ? "active2"
    //                     : ""
    //                 }
    //               >
    //                 No. of Officers
    //               </label>
    //             </div>

    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={item.hours}
    //                 onChange={(e) =>
    //                   handleCostItemChange(idx, "hours", e.target.value)
    //                 }
    //                 min={0}
    //                 step="0.1"
    //                 className="input"
    //                 onFocus={() => onFocus(`hr_hrs_${idx}`)}
    //                 onBlur={() => onBlur(`hr_hrs_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`hr_hrs_${idx}`] || item.hours ? "active2" : ""
    //                 }
    //               >
    //                 Hours
    //               </label>
    //             </div>

    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={item.rate}
    //                 readOnly={rateLocked}
    //                 step="0.01"
    //                 className="input"
    //                 onChange={(e) =>
    //                   handleCostItemChange(idx, "rate", e.target.value)
    //                 }
    //                 onFocus={() => onFocus(`hr_rate_${idx}`)}
    //                 onBlur={() => onBlur(`hr_rate_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`hr_rate_${idx}`] || item.rate ? "active2" : ""
    //                 }
    //               >
    //                 Rate
    //               </label>
    //             </div>

    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={item.amount}
    //                 step="0.01"
    //                 className="input"
    //                 onChange={(e) =>
    //                   handleCostItemChange(idx, "amount", e.target.value)
    //                 }
    //                 onFocus={() => onFocus(`hr_amt_${idx}`)}
    //                 onBlur={() => onBlur(`hr_amt_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`hr_amt_${idx}`] || item.amount ? "active2" : ""
    //                 }
    //               >
    //                 Amount
    //               </label>
    //             </div>

    //             <div className="pfbtns">
    //               <button
    //                 type="button"
    //                 className="RemAdd"
    //                 onClick={() => removeCostItem(idx)}
    //               >
    //                 Remove
    //               </button>
    //             </div>
    //           </div>
    //         );
    //       })}
    //     </div>
    //     <div className="pfbtns">
    //       <button type="button" className="addNew" onClick={addCostItem}>
    //         + Add Cost Item
    //       </button>
    //     </div>

    //     <h3 className="page-description-type2 h2-type2">Materials</h3>
    //     <div className="step-two-grid aid-request-form-type2">
    //       {formData.materials.map((mat, idx) => {
    //         const rateEntry = getRateInfo(
    //           mat.item_description,
    //           MATERIALS_CATEGORY
    //         );
    //         const rateLocked = !!rateEntry && !isPrivileged;
    //         return (
    //           <div key={idx} className="expense-entry">
    //             <div className="form-step" style={{ flex: 2 }}>
    //               <CreatableSelect
    //                 styles={customSelectStyles}
    //                 placeholder=" "
    //                 value={
    //                   mat.item_description
    //                     ? {
    //                         label: mat.item_description,
    //                         value: mat.item_description,
    //                       }
    //                     : null
    //                 }
    //                 onChange={(opt) =>
    //                   handleMaterialChange(
    //                     idx,
    //                     "item_description",
    //                     opt?.value || ""
    //                   )
    //                 }
    //                 options={materialOptions}
    //                 isClearable
    //                 isSearchable
    //                 onFocus={() => onFocus(`mat_desc_${idx}`)}
    //                 onBlur={() => onBlur(`mat_desc_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`mat_desc_${idx}`] || mat.item_description
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
    //                 placeholder=" "
    //                 value={mat.required_quantity}
    //                 min={0}
    //                 className="input"
    //                 onChange={(e) =>
    //                   handleMaterialChange(
    //                     idx,
    //                     "required_quantity",
    //                     e.target.value
    //                   )
    //                 }
    //                 onFocus={() => onFocus(`mat_qty_${idx}`)}
    //                 onBlur={() => onBlur(`mat_qty_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`mat_qty_${idx}`] || mat.required_quantity
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
    //                 placeholder=" "
    //                 value={mat.rate}
    //                 readOnly={rateLocked}
    //                 step="0.01"
    //                 className="input"
    //                 onChange={(e) =>
    //                   handleMaterialChange(idx, "rate", e.target.value)
    //                 }
    //                 onFocus={() => onFocus(`mat_rate_${idx}`)}
    //                 onBlur={() => onBlur(`mat_rate_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`mat_rate_${idx}`] || mat.rate ? "active2" : ""
    //                 }
    //               >
    //                 Rate
    //               </label>
    //             </div>

    //             <div className="form-step" style={{ flex: 1 }}>
    //               <input
    //                 type="number"
    //                 placeholder=" "
    //                 value={mat.cost}
    //                 step="0.01"
    //                 className="input"
    //                 onChange={(e) =>
    //                   handleMaterialChange(idx, "cost", e.target.value)
    //                 }
    //                 onFocus={() => onFocus(`mat_cost_${idx}`)}
    //                 onBlur={() => onBlur(`mat_cost_${idx}`)}
    //               />
    //               <label
    //                 className={
    //                   focused[`mat_cost_${idx}`] || mat.cost ? "active2" : ""
    //                 }
    //               >
    //                 Cost
    //               </label>
    //             </div>

    //             <div className="pfbtns">
    //               <button
    //                 type="button"
    //                 className="RemAdd"
    //                 onClick={() => removeMaterial(idx)}
    //               >
    //                 Remove
    //               </button>
    //             </div>
    //           </div>
    //         );
    //       })}
    //     </div>

    //     <div className="pfbtns">
    //       <button type="button" className="addNew" onClick={addMaterial}>
    //         + Add Material
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
          Fill Out The Course Delivery Costs{" "}
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

          <div>
            <label className="mb-1 text-gray-700 font-medium">
              MD Approval Obtained
            </label>
            <Select
              styles={customSelectStyles}
              name="Md_approval_obtained"
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Approved", label: "Approved" },
                { value: "Denied", label: "Denied" },
              ]}
              value={
                formData.Md_approval_obtained
                  ? {
                      value: formData.Md_approval_obtained,
                      label: formData.Md_approval_obtained,
                    }
                  : null
              }
              onChange={(selected) =>
                handleChange({
                  target: {
                    name: "Md_approval_obtained",
                    value: selected?.value || "",
                  },
                })
              }
              placeholder=" "
              isClearable
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 text-gray-700 font-medium">MD Details</label>
            <textarea
              name="Md_details"
              value={formData.Md_details}
              onChange={handleChange}
              className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-2
                     focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                     hover:border-[#01eeff] transition"
            />
          </div>
        </div>

        {/* Human Resource Cost Items */}
        <h3 className="text-xl font-semibold text-gray-800">
          Human Resource Cost Items
        </h3>
        <div className="space-y-4">
          {formData.cost_items.map((item, idx) => {
            const rateEntry = getRateInfo(item.role, HR_CATEGORY);
            const rateLocked = !!rateEntry && !isPrivileged;

            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
              >
                <div className="col-span-2">
                  <label className="mb-1 text-gray-700 font-medium">Role</label>
                  <Select
                    styles={customSelectStyles}
                    placeholder=" "
                    value={
                      item.role ? { label: item.role, value: item.role } : null
                    }
                    onChange={(option) =>
                      handleCostItemChange(idx, "role", option?.value || "")
                    }
                    options={hrOptions}
                    isClearable
                    isSearchable
                  />
                </div>

                <div>
                  <label className="mb-1 text-gray-700 font-medium">
                    No. of Officers
                  </label>
                  <input
                    type="number"
                    value={item.no_of_officers}
                    onChange={(e) =>
                      handleCostItemChange(
                        idx,
                        "no_of_officers",
                        e.target.value
                      )
                    }
                    min={0}
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition"
                  />
                </div>

                <div>
                  <label className="mb-1 text-gray-700 font-medium">
                    Hours
                  </label>
                  <input
                    type="number"
                    value={item.hours}
                    onChange={(e) =>
                      handleCostItemChange(idx, "hours", e.target.value)
                    }
                    min={0}
                    step="0.1"
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition"
                  />
                </div>

                <div>
                  <label className="mb-1 text-gray-700 font-medium">Rate</label>
                  <input
                    type="number"
                    value={item.rate}
                    readOnly={rateLocked}
                    step="0.01"
                    onChange={(e) =>
                      handleCostItemChange(idx, "rate", e.target.value)
                    }
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
                    value={item.amount}
                    step="0.01"
                    onChange={(e) =>
                      handleCostItemChange(idx, "amount", e.target.value)
                    }
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => removeCostItem(idx)}
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
          onClick={addCostItem}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          + Add Cost Item
        </button>

        {/* Materials */}
        <h3 className="text-xl font-semibold text-gray-800">Materials</h3>
        <div className="space-y-4">
          {formData.materials.map((mat, idx) => {
            const rateEntry = getRateInfo(
              mat.item_description,
              MATERIALS_CATEGORY
            );
            const rateLocked = !!rateEntry && !isPrivileged;

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
                      mat.item_description
                        ? {
                            label: mat.item_description,
                            value: mat.item_description,
                          }
                        : null
                    }
                    onChange={(opt) =>
                      handleMaterialChange(
                        idx,
                        "item_description",
                        opt?.value || ""
                      )
                    }
                    options={materialOptions}
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
                    value={mat.required_quantity}
                    min={0}
                    onChange={(e) =>
                      handleMaterialChange(
                        idx,
                        "required_quantity",
                        e.target.value
                      )
                    }
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition"
                  />
                </div>

                <div>
                  <label className="mb-1 text-gray-700 font-medium">Rate</label>
                  <input
                    type="number"
                    value={mat.rate}
                    readOnly={rateLocked}
                    step="0.01"
                    onChange={(e) =>
                      handleMaterialChange(idx, "rate", e.target.value)
                    }
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1 text-gray-700 font-medium">Cost</label>
                  <input
                    type="number"
                    value={mat.cost}
                    step="0.01"
                    onChange={(e) =>
                      handleMaterialChange(idx, "cost", e.target.value)
                    }
                    className="w-full border-2 border-[#00a6ff9d] rounded-md px-3 py-1.5
                           focus:border-[#01eeff] focus:ring-1 focus:ring-[#01eeff]
                           hover:border-[#01eeff] transition"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(idx)}
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
          onClick={addMaterial}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          + Add Material
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

export default CourseDeliveryCostForm;
