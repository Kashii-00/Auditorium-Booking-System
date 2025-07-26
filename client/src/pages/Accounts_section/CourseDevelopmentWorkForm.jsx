import React, { useEffect, useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import { authRequest } from "../../services/authService";
import "./styles/styles.css";

const PRIVILEGED_ROLES = ["SuperAdmin", "finance_manager", "admin"];
const CATEGORY = "Course Development Work";

// Normalize user roles like backend
const normalizeRoles = (rawRole) => {
  if (!rawRole) return [];
  if (Array.isArray(rawRole)) return rawRole;
  try {
    return JSON.parse(rawRole);
  } catch {
    return [rawRole];
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
  valueContainer: (base) => ({ ...base, padding: "2px 6px", fontSize: "12px" }),
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

  // const [formData, setFormData] = useState({
  //   payments_main_details_id: "",
  //   no_of_panel_meetings: 0,
  //   expenses: [],
  //   participants: [],
  // });
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
        const response = await authRequest(
          "get",
          "http://localhost:5003/api/rates"
        );
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

  // // --- GENERAL FORM FIELD ---
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   // For numeric inputs, store as string to allow empty input but convert before submit
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

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
        "http://localhost:5003/api/course-development-work/full",
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

  if (reviewMode) {
    return (
      <div className="mainCostCon">
        <div className="review2Con">
          <h2>Review Course Development Work</h2>

          <div>
            <strong>Payments Main Details ID:</strong>{" "}
            {formData.payments_main_details_id || <em>Not Provided</em>}
          </div>
          <div>
            <strong>No. of Panel Meetings:</strong>{" "}
            {formData.no_of_panel_meetings || <em>Not Provided</em>}
          </div>

          <section>
            <h3>Expenses</h3>
            {formData.expenses.length === 0 ? (
              <p>
                <em>No expenses added.</em>
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Required Quantity</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.expenses.map((e, i) => (
                      <tr key={i}>
                        <td>{e.item_description || <em>N/A</em>}</td>
                        <td>{e.required_quantity ?? <em>N/A</em>}</td>
                        <td>{e.rate ?? <em>N/A</em>}</td>
                        <td>{e.amount ?? <em>N/A</em>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3>Participants</h3>
            {formData.participants.length === 0 ? (
              <p>
                <em>No participants added.</em>
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Participant Type</th>
                      <th>Nos</th>
                      <th>Rate Per Hour</th>
                      <th>SMEs</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.participants.map((p, i) => (
                      <tr key={i}>
                        <td>{p.participant_type || <em>N/A</em>}</td>
                        <td>{p.nos ?? <em>N/A</em>}</td>
                        <td>{p.rate_per_hour ?? <em>N/A</em>}</td>
                        <td>{p.smes || <em>N/A</em>}</td>
                        <td>{p.amount ?? <em>N/A</em>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="review-buttons">
            <button
              type="button"
              className="ccfbtn"
              onClick={() => setReviewMode(false)}
            >
              Back to Edit
            </button>
            <button
              type="button"
              className="ccfbtn"
              onClick={handleFinalSubmit}
            >
              Confirm & Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mainCostCon">
      <form className="aid-request-form-type2" onSubmit={handleSubmit}>
        <h2 className="page-description-type2 h2-type2">
          Fill Out The Course Development Work{" "}
          {isPrivileged && <span style={{ color: "cyan" }}>(PRIVILEGED)</span>}
        </h2>
        {successMessage && (
          <div className="success-popup2">{successMessage}</div>
        )}
        {error && <div className="error-popup2">{error}</div>}

        <div className="step-two-grid aid-request-form-type2">
          {/* Payments Main Details ID */}
          <div className=" form-step">
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
              placeholder=" "
              onFocus={() => onFocus("payments_main_details_id")}
              onBlur={() => onBlur("payments_main_details_id")}
            />
            <label
              className={
                focused.payments_main_details_id ||
                formData.payments_main_details_id
                  ? "active2"
                  : ""
              }
            >
              Payments Main Details ID
            </label>
          </div>

          {/* No of Panel Meetings */}
          <div className="form-step">
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
              placeholder=" "
              onFocus={() => onFocus("no_of_panel_meetings")}
              onBlur={() => onBlur("no_of_panel_meetings")}
            />
            <label
              className={
                focused.no_of_panel_meetings || formData.no_of_panel_meetings
                  ? "active2"
                  : ""
              }
            >
              No of Panel Meetings
            </label>
          </div>
        </div>

        <h2 className="page-description-type2 h2-type2">Expenses</h2>
        <div className="step-two-grid aid-request-form-type2">
          {formData.expenses.map((exp, idx) => {
            const rateEntry = getRateInfo(exp.item_description);
            const rateLocked = !!rateEntry && !isPrivileged;
            const amountLocked =
              !!rateEntry &&
              rateEntry.rate_type !== "Full Payment" &&
              !isPrivileged;

            return (
              <div key={idx} className="expense-entry">
                <div className="form-step" style={{ flex: 2, minWidth: 200 }}>
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
                    onFocus={() => onFocus(`exp_desc_${idx}`)}
                    onBlur={() => onBlur(`exp_desc_${idx}`)}
                  />
                  <label
                    className={
                      focused[`exp_desc_${idx}`] || exp.item_description
                        ? "active2"
                        : ""
                    }
                  >
                    Item Description
                  </label>
                </div>
                <div className="form-step" style={{ flex: 1 }}>
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
                    step={1}
                    placeholder=" "
                    onFocus={() => onFocus(`exp_qty_${idx}`)}
                    onBlur={() => onBlur(`exp_qty_${idx}`)}
                  />
                  <label
                    className={
                      focused[`exp_qty_${idx}`] || exp.required_quantity
                        ? "active2"
                        : ""
                    }
                  >
                    Required Quantity
                  </label>
                </div>
                <div className="form-step" style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.01"
                    value={exp.rate}
                    onChange={(e) =>
                      handleExpenseChange(idx, "rate", e.target.value)
                    }
                    readOnly={rateLocked}
                    placeholder=" "
                    onFocus={() => onFocus(`exp_rate_${idx}`)}
                    onBlur={() => onBlur(`exp_rate_${idx}`)}
                  />
                  <label
                    className={
                      focused[`exp_rate_${idx}`] || exp.rate ? "active2" : ""
                    }
                  >
                    Rate
                  </label>
                </div>
                <div className="form-step" style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.01"
                    value={exp.amount}
                    onChange={(e) =>
                      handleExpenseChange(idx, "amount", e.target.value)
                    }
                    readOnly={amountLocked}
                    title={amountLocked ? "Locked by rate table" : ""}
                    placeholder=" "
                    onFocus={() => onFocus(`exp_amt_${idx}`)}
                    onBlur={() => onBlur(`exp_amt_${idx}`)}
                  />
                  <label
                    className={
                      focused[`exp_amt_${idx}`] || exp.amount ? "active2" : ""
                    }
                  >
                    Amount
                  </label>
                </div>
                <div className="pfbtns">
                  <button
                    type="button"
                    className="RemAdd"
                    onClick={() => removeExpense(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pfbtns">
          <button type="button" className="addNew" onClick={addExpense}>
            + Add Expense
          </button>
        </div>

        <h2 className="page-description-type2 h2-type2">Participants</h2>
        <div className="step-two-grid aid-request-form-type2">
          {formData.participants.map((p, idx) => {
            const rateEntry = getRateInfo(p.participant_type);
            const rateLocked = !!rateEntry && !isPrivileged;
            const amountLocked = !!rateEntry && !isPrivileged;

            return (
              <div key={idx} className="participant-entry">
                <div className="form-step" style={{ flex: 2, minWidth: 200 }}>
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
                    onFocus={() => onFocus(`part_type_${idx}`)}
                    onBlur={() => onBlur(`part_type_${idx}`)}
                  />
                  <label
                    className={
                      focused[`part_type_${idx}`] || p.participant_type
                        ? "active2"
                        : ""
                    }
                  >
                    Participant Type
                  </label>
                </div>
                <div className="form-step" style={{ flex: 1 }}>
                  <input
                    type="number"
                    value={p.nos}
                    onChange={(e) =>
                      handleParticipantChange(idx, "nos", e.target.value)
                    }
                    min={1}
                    step={1}
                    placeholder=" "
                    onFocus={() => onFocus(`part_nos_${idx}`)}
                    onBlur={() => onBlur(`part_nos_${idx}`)}
                  />
                  <label
                    className={
                      focused[`part_nos_${idx}`] || p.nos ? "active2" : ""
                    }
                  >
                    Nos
                  </label>
                </div>
                <div className="form-step" style={{ flex: 1 }}>
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
                    placeholder=" "
                    onFocus={() => onFocus(`part_rate_${idx}`)}
                    onBlur={() => onBlur(`part_rate_${idx}`)}
                  />
                  <label
                    className={
                      focused[`part_rate_${idx}`] || p.rate_per_hour
                        ? "active2"
                        : ""
                    }
                  >
                    Rate Per Hour
                  </label>
                </div>
                <div className="form-step" style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={p.smes}
                    onChange={(e) =>
                      handleParticipantChange(idx, "smes", e.target.value)
                    }
                    placeholder=" "
                    onFocus={() => onFocus(`part_smes_${idx}`)}
                    onBlur={() => onBlur(`part_smes_${idx}`)}
                  />
                  <label
                    className={
                      focused[`part_smes_${idx}`] || p.smes ? "active2" : ""
                    }
                  >
                    SMEs
                  </label>
                </div>
                <div className="form-step" style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.01"
                    value={p.amount}
                    onChange={(e) =>
                      handleParticipantChange(idx, "amount", e.target.value)
                    }
                    readOnly={amountLocked}
                    title={amountLocked ? "Locked by rate table" : ""}
                    placeholder=" "
                    onFocus={() => onFocus(`part_amt_${idx}`)}
                    onBlur={() => onBlur(`part_amt_${idx}`)}
                  />
                  <label
                    className={
                      focused[`part_amt_${idx}`] || p.amount ? "active2" : ""
                    }
                  >
                    Amount
                  </label>
                </div>
                <div className="pfbtns">
                  <button
                    type="button"
                    className="RemAdd"
                    onClick={() => removeParticipant(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pfbtns">
          <button type="button" className="addNew" onClick={addParticipant}>
            + Add Participant
          </button>
        </div>
        <hr className="form-divider" />
        <div className="form-buttons-sticky btnHalf">
          <div className="navigation-buttons">
            <button
              type="submit"
              className="ccfbtn"
              style={{ marginRight: "10px" }}
            >
              Review
            </button>
            <button type="button" className="ccfbtn" onClick={clearForm}>
              Clear Form
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CourseDevelopmentWorkForm;
