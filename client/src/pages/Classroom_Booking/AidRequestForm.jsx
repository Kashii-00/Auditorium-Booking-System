import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import "./styles/aidHandover.css";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  itemDescriptionMapping,
  groupedCourseOptions,
  dayOptions,
  generateTimeOptions,
  classroomOptions,
} from "./aidUtils";

const AidRequestForm = () => {
  const [aidRequest, setAidRequest] = useState({
    requesting_officer_name: "",
    designation: "",
    requesting_officer_email: "",
    course_name: "",
    duration: "",
    audience_type: "",
    no_of_participants: 0,
    course_coordinator: "",
    date_from: "",
    date_to: "",
    time_from: "",
    time_to: "",
    preferred_days_of_week: [],
    paid_course_or_not: "No",
    payment_status: "Not Set",
    signed_date: "",
    request_status: "pending",
    classrooms_allocated: [],
    exam_or_not: "No",
    cancelled_by_requester: "No",
  });
  const [aidItems, setAidItems] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const timeOptions = generateTimeOptions();

  const [hasLoadedAidRequest, setHasLoadedAidRequest] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [remarkForAll, setRemarkForAll] = useState("");
  const [validDayOptions, setValidDayOptions] = useState(dayOptions);

  const navigate = useNavigate();

  const addAidItem = () => {
    setAidItems((prev) => [
      ...prev,
      {
        item_no: "01",
        description: itemDescriptionMapping["01"],
        quantity: "1",
        remark: remarkForAll,
        md_approval_required_or_not: "No",
        md_approval_obtained: "No",
        md_approval_details: "",
        CTM_approval_obtained: "-",
        CTM_Details: "-",
      },
    ]);
  };

  useEffect(() => {
    if (!aidRequest.date_from || !aidRequest.date_to) {
      setValidDayOptions(dayOptions); // Show all days by default
      return;
    }

    const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dateFrom = new Date(aidRequest.date_from);
    const dateTo = new Date(aidRequest.date_to);

    const validDays = new Set();
    let current = new Date(dateFrom);

    while (current <= dateTo) {
      validDays.add(shortDayNames[current.getDay()]);
      current.setDate(current.getDate() + 1);
    }

    const filteredOptions = dayOptions.filter((opt) =>
      validDays.has(opt.value)
    );
    setValidDayOptions(filteredOptions);

    // Auto-remove previously selected invalid days
    setAidRequest((prev) => ({
      ...prev,
      preferred_days_of_week: prev.preferred_days_of_week.filter((d) =>
        validDays.has(d)
      ),
    }));
  }, [aidRequest.date_from, aidRequest.date_to]);

  useEffect(() => {
    const savedAidRequest = localStorage.getItem("aidRequestData");
    const savedAidItems = localStorage.getItem("aidItemsData");

    if (savedAidRequest) {
      try {
        const parsedRequest = JSON.parse(savedAidRequest);
        setAidRequest((prev) => ({
          ...prev,
          ...parsedRequest,
          classrooms_allocated: Array.isArray(
            parsedRequest.classrooms_allocated
          )
            ? parsedRequest.classrooms_allocated
            : [],
          exam_or_not: parsedRequest.exam_or_not || "No",
        }));
        console.log(
          "Restored aidRequestData from localStorage:",
          parsedRequest
        );
      } catch (e) {
        console.error("Failed to parse aidRequestData:", e);
      }
    }

    if (savedAidItems) {
      try {
        const parsedItems = JSON.parse(savedAidItems);

        const sanitizedItems = parsedItems.map((item) => ({
          ...item,
          md_approval_required_or_not: item.md_approval_required_or_not || "No",
          md_approval_obtained: item.md_approval_obtained || "No",
          md_approval_details: item.md_approval_details || "",
          CTM_approval_obtained: item.CTM_approval_obtained || "-",
          CTM_Details: item.CTM_Details || "-",
        }));

        setAidItems(sanitizedItems);
        console.log("Restored aidItemsData from localStorage:", sanitizedItems);
      } catch (e) {
        console.error("Failed to parse aidItemsData:", e);
      }
    }

    setHasLoadedAidRequest(true);
  }, []);

  useEffect(() => {
    if (hasLoadedAidRequest) {
      localStorage.setItem("aidRequestData", JSON.stringify(aidRequest));
      console.log("Saved aidRequestData to localStorage:", aidRequest);
    }
  }, [aidRequest, hasLoadedAidRequest]);

  useEffect(() => {
    if (hasLoadedAidRequest) {
      localStorage.setItem("aidItemsData", JSON.stringify(aidItems));
      console.log("Saved aidItemsData to localStorage:", aidItems);
    }
  }, [aidItems, hasLoadedAidRequest]);

  const clearAndRefresh = (keys) => {
    if (window.confirm("Are you sure you want to clear saved form data?")) {
      keys.forEach((key) => localStorage.removeItem(key));
      console.log("Cleared localStorage keys:", keys);

      setAidRequest({
        requesting_officer_name: "",
        designation: "",
        requesting_officer_email: "",
        course_name: "",
        duration: "",
        audience_type: "",
        no_of_participants: 0,
        course_coordinator: "",
        date_from: "",
        date_to: "",
        time_from: "",
        time_to: "",
        preferred_days_of_week: [],
        paid_course_or_not: "No",
        payment_status: "Not Set",
        signed_date: "",
        request_status: "pending",
        classrooms_allocated: [],
        exam_or_not: "No",
        cancelled_by_requester: "No",
      });
      setAidItems([]);
      setCurrentStep(1);
    }
  };

  const handleAidRequestChange = (e) => {
    const { name, value } = e.target;

    if (name === "preferred_days_of_week") {
      const options = e.target.selectedOptions;
      const values = Array.from(options, (opt) => opt.value);
      setAidRequest((prev) => ({ ...prev, [name]: values }));
      return;
    }

    setAidRequest((prev) => {
      const updated = { ...prev, [name]: value };
      const isDate =
        name === "date_from" || name === "date_to" || name === "signed_date";
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // If changing from Yes to No, reset CTM fields in aidItems
      if (name === "paid_course_or_not" && value === "No") {
        setAidItems((prevItems) =>
          prevItems.map((item) => {
            if (item.item_no === "03") {
              return {
                ...item,
                CTM_approval_obtained: "-",
                CTM_Details: "-",
              };
            }
            return item;
          })
        );
      }

      // Prevent past dates
      if (isDate && new Date(value) < todayDate) {
        alert("You cannot select a past date.");
        return prev;
      }

      // Validate date range
      if (
        name === "date_from" &&
        updated.date_to &&
        new Date(value) > new Date(updated.date_to)
      ) {
        alert("Start date cannot be after end date.");
        return prev;
      }

      if (
        name === "date_to" &&
        updated.date_from &&
        new Date(updated.date_from) > new Date(value)
      ) {
        alert("End date cannot be before start date.");
        return prev;
      }

      // Always validate time range if both are present
      if (
        (name === "time_from" ||
          name === "time_to" ||
          updated.time_from ||
          updated.time_to) &&
        updated.time_from &&
        updated.time_to
      ) {
        const [h1, m1] = updated.time_from.split(":").map(Number);
        const [h2, m2] = updated.time_to.split(":").map(Number);
        const t1 = h1 * 60 + m1;
        const t2 = h2 * 60 + m2;

        if (t1 >= t2) {
          alert("Start time must be before end time.");
          return prev;
        }
      }

      return updated;
    });
  };

  const getClassName = (defaultClass = "form-step") => {
    return currentStep === 3 ? `${defaultClass} half-width` : defaultClass;
  };

  const handlePreferredDaysChange = (selectedOptions) => {
    const selectedValues = selectedOptions.map((opt) => opt.value);
    setAidRequest((prev) => ({
      ...prev,
      preferred_days_of_week: selectedValues,
    }));
  };

  const handleAidItemChange = (index, e) => {
    const { name, value } = e.target;

    // If the field is 'remark', set it for all items
    if (name === "remark") {
      setRemarkForAll(value);
      const newItems = aidItems.map((item) => ({
        ...item,
        remark: value,
      }));
      setAidItems(newItems);
      return;
    }

    const updatedItems = [...aidItems];
    const currentItem = { ...updatedItems[index] };

    // If item_no is changed, reset MD fields and update description
    if (name === "item_no") {
      // Reset MD fields unconditionally
      currentItem.md_approval_required_or_not = "No";
      currentItem.md_approval_obtained = "No";
      currentItem.md_approval_details = "";

      currentItem.CTM_approval_obtained = "-";
      currentItem.CTM_Details = "-";

      currentItem.item_no = value;

      // Update description
      if (value === "14") {
        currentItem.description = "";
      } else {
        currentItem.description = itemDescriptionMapping[value] || "";
      }

      updatedItems[index] = currentItem;
      setAidItems(updatedItems);
      return; // Exit early since all logic for item_no is done
    }

    // Evaluate if current description is Auditorium
    const isAuditoriumOrMisc =
      currentItem.description.toLowerCase().trim() === "auditorium" ||
      currentItem.item_no === "14";

    const mdFields = [
      "md_approval_required_or_not",
      "md_approval_obtained",
      "md_approval_details",
    ];

    if (!isAuditoriumOrMisc && mdFields.includes(name)) {
      return;
    }

    const shouldAllowCTMFields =
      aidRequest.paid_course_or_not === "Yes" && currentItem.item_no === "03";

    const ctmFields = ["CTM_approval_obtained", "CTM_Details"];
    if (!shouldAllowCTMFields && ctmFields.includes(name)) {
      return;
    }

    currentItem[name] = value;

    updatedItems[index] = currentItem;
    setAidItems(updatedItems);
  };

  const handleAidItemBlur = (index, e) => {
    const { value } = e.target;
    const updatedItems = [...aidItems];
    if (
      updatedItems[index].item_no === "14" &&
      value &&
      !value.includes("(miscellaneous)")
    ) {
      updatedItems[index].description = `${value.trim()} (miscellaneous)`;
      setAidItems(updatedItems);
    }
  };

  const removeAidItem = (index) => {
    setAidItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateAidRequest(aidRequest);
    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    // (Optional safety net)
    if (!validateStep()) {
      alert("Please complete all required fields before submitting.");
      return;
    }

    // Convert preferred_days_of_week array to a comma-separated string
    const updatedAidRequest = {
      ...aidRequest,
      preferred_days_of_week: aidRequest.preferred_days_of_week.join(","),
      classrooms_allocated: aidRequest.classrooms_allocated.join(","),
      payment_status:
        aidRequest.paid_course_or_not === "Yes" ? "pending" : "Not Set",
    };

    setIsSubmitting(true);
    try {
      console.log(
        "Submitting aid request payload:",
        updatedAidRequest,
        aidItems
      );
      const response = await authRequest(
        "post",
        getApiUrl("/aidrequests"),
        {
          aidRequest: updatedAidRequest, // Pass the updated aidRequest
          aidItems,
        }
      );

      setSuccessMessage(
        `Aid Request created successfully! Your Request Id is: ${response.request_id}`
      );

      console.log("Response:", response.data);

      // Reset form fields after submission
      setAidRequest({
        requesting_officer_name: "",
        designation: "",
        requesting_officer_email: "",
        course_name: "",
        duration: "",
        audience_type: "",
        no_of_participants: 0,
        course_coordinator: "",
        date_from: "",
        date_to: "",
        time_from: "",
        time_to: "",
        preferred_days_of_week: [],
        paid_course_or_not: "No",
        payment_status: "Not Set",
        signed_date: "",
        request_status: "pending",
        classrooms_allocated: [],
        exam_or_not: "No",
        cancelled_by_requester: "No",
      });
      setAidItems([]);
      localStorage.removeItem("aidRequestData");
      localStorage.removeItem("aidItemsData");
      setCurrentStep(1);
      console.log("Cleared aidRequestData and aidItemsData from localStorage");
    } catch (err) {
      console.error("Error creating aid request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAidRequest = (aidRequest) => {
    const errors = [];

    // Validate required dates
    const dateFrom = new Date(aidRequest.date_from);
    const dateTo = new Date(aidRequest.date_to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!aidRequest.date_from || !aidRequest.date_to) {
      errors.push("Both start and end dates are required.");
    } else {
      if (dateFrom < today || dateTo < today) {
        errors.push("Dates cannot be in the past.");
      }
      if (dateFrom > dateTo) {
        errors.push("Start date cannot be after end date.");
      }
    }

    // Validate required times
    if (!aidRequest.time_from || !aidRequest.time_to) {
      errors.push("Both start and end times are required.");
    } else {
      const [h1, m1] = aidRequest.time_from.split(":").map(Number);
      const [h2, m2] = aidRequest.time_to.split(":").map(Number);
      const t1 = h1 * 60 + m1;
      const t2 = h2 * 60 + m2;

      if (t1 >= t2) {
        errors.push("Start time must be before end time.");
      }
    }
    return errors;
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const SuccessPopup = ({ message }) => (
    <div className="success-popup">
      <svg
        className="icon"
        xmlns="https://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
      </svg>
      <p className="font-bold">{message}</p>
    </div>
  );

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return (
          aidRequest.requesting_officer_name.trim() &&
          aidRequest.designation.trim() &&
          aidRequest.requesting_officer_email.trim() &&
          aidRequest.course_name.trim() &&
          aidRequest.duration.trim() &&
          aidRequest.audience_type.trim()
        );
      case 2:
        return (
          aidRequest.no_of_participants > 0 &&
          aidRequest.course_coordinator.trim() &&
          aidRequest.date_from &&
          aidRequest.date_to &&
          aidRequest.time_from &&
          aidRequest.time_to
        );
      case 3:
        return (
          aidRequest.preferred_days_of_week.length > 0 &&
          aidRequest.paid_course_or_not &&
          aidRequest.signed_date &&
          aidRequest.exam_or_not
        );
      case 4:
        return (
          aidItems.length > 0 &&
          aidItems.every((item) => {
            const isAuditoriumOrMisc =
              item.description.toLowerCase() === "auditorium" ||
              item.item_no === "14";

            const isCTMRequired =
              aidRequest.paid_course_or_not === "Yes" && item.item_no === "03";

            const baseValid =
              item.item_no &&
              item.description.trim() &&
              item.quantity > 0 &&
              item.remark.trim();

            const mdValid = isAuditoriumOrMisc
              ? item.md_approval_required_or_not.trim() &&
                item.md_approval_obtained.trim()
              : true;

            const ctmValid = isCTMRequired
              ? item.CTM_approval_obtained?.trim() && item.CTM_Details?.trim()
              : true;

            return baseValid && mdValid && ctmValid;
          })
        );
      case 5:
        // Just check that all steps are valid using *local conditions* (don't call validateStep again)
        const step1Valid =
          aidRequest.requesting_officer_name.trim() &&
          aidRequest.designation.trim() &&
          aidRequest.requesting_officer_email.trim() &&
          aidRequest.course_name.trim() &&
          aidRequest.duration.trim() &&
          aidRequest.audience_type.trim();

        const step2Valid =
          aidRequest.no_of_participants > 0 &&
          aidRequest.course_coordinator.trim() &&
          aidRequest.date_from &&
          aidRequest.date_to &&
          aidRequest.time_from &&
          aidRequest.time_to;

        const step3Valid =
          aidRequest.preferred_days_of_week.length > 0 &&
          aidRequest.paid_course_or_not &&
          aidRequest.signed_date &&
          aidRequest.exam_or_not;

        const step4Valid =
          aidItems.length > 0 &&
          aidItems.every((item) => {
            const isAuditoriumOrMisc =
              item.description.toLowerCase() === "auditorium" ||
              item.item_no === "14";

            const isCTMRequired =
              aidRequest.paid_course_or_not === "Yes" && item.item_no === "03";

            const baseValid =
              item.item_no &&
              item.description.trim() &&
              item.quantity > 0 &&
              item.remark.trim();

            const mdValid = isAuditoriumOrMisc
              ? item.md_approval_required_or_not.trim() &&
                item.md_approval_obtained.trim()
              : true;

            const ctmValid = isCTMRequired
              ? item.CTM_approval_obtained?.trim() && item.CTM_Details?.trim()
              : true;

            return baseValid && mdValid && ctmValid;
          });

        return step1Valid && step2Valid && step3Valid && step4Valid;

      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      alert("Please fill in all required fields on this step.");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const renderAidRequestField = (
    field,
    aidRequest,
    handleChange,
    today,
    timeOptions,
    handlePreferredDaysChange,
    groupedCourseOptions,
    dayOptions,
    classroomOptions
  ) => {
    if (field === "request_status" || field === "payment_status") return null;

    const label = field.replaceAll("_", " ");

    switch (field) {
      case "course_name":
        return (
          <div key={field} className={getClassName()}>
            <CreatableSelect
              isClearable
              options={groupedCourseOptions}
              onChange={(selectedOption) =>
                handleChange({
                  target: {
                    name: "course_name",
                    value: selectedOption ? selectedOption.value : "",
                  },
                })
              }
              value={
                aidRequest.course_name
                  ? {
                      label: aidRequest.course_name,
                      value: aidRequest.course_name,
                    }
                  : null
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || hasValue ? "active" : ""}
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "preferred_days_of_week":
        return (
          <div key={field} className={getClassName()}>
            <Select
              isMulti
              name={field}
              options={validDayOptions}
              value={
                Array.isArray(aidRequest[field])
                  ? dayOptions.filter((option) =>
                      aidRequest[field].includes(option.value)
                    )
                  : []
              }
              onChange={handlePreferredDaysChange}
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={
                isFocused || aidRequest[field]?.length > 0 ? "active" : ""
              }
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "paid_course_or_not":
        return (
          <div key={field} className={getClassName()}>
            <Select
              name={field}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              value={
                aidRequest[field]
                  ? { value: aidRequest[field], label: aidRequest[field] }
                  : null
              }
              onChange={(selected) =>
                handleChange({ target: { name: field, value: selected.value } })
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || aidRequest[field] !== "" ? "active" : ""}
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "audience_type":
        return (
          <div key={field} className={getClassName()}>
            <Select
              name={field}
              options={[
                { value: "Internal (SLPA)", label: "Internal (SLPA)" },
                { value: "External", label: "External" },
                { value: "Mixed", label: "Mixed" },
              ]}
              value={
                aidRequest[field]
                  ? { value: aidRequest[field], label: aidRequest[field] }
                  : null
              }
              onChange={(selected) =>
                handleChange({ target: { name: field, value: selected.value } })
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || aidRequest[field] !== "" ? "active" : ""}
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "date_from":
      case "date_to":
      case "signed_date":
        const dateFrom = aidRequest["date_from"];

        let inputProps = {
          name: field,
          value: aidRequest[field],
          onChange: handleChange,
          required: true,
          placeholder: " ",
          type: "date",
          min: today,
        };

        if (field === "date_to") {
          inputProps.disabled = !dateFrom;
          if (dateFrom) inputProps.min = dateFrom;
        }

        return (
          <div key={field} className={getClassName()}>
            <input {...inputProps} />
            <label htmlFor={field}>{label}</label>
          </div>
        );

      case "time_from":
      case "time_to":
        // For convenience, get current times from state
        const timeFromValue = aidRequest["time_from"];
        const timeToValue = aidRequest["time_to"];

        // Filtered options for time_to only:
        const filteredTimeOptions =
          field === "time_to"
            ? timeOptions.filter(
                (time) => !timeFromValue || time.value > timeFromValue
              )
            : timeOptions;

        return (
          <div key={field} className={getClassName()}>
            <select
              name={field}
              value={aidRequest[field]}
              onChange={(e) => {
                handleChange(e);

                if (field === "time_from") {
                  const newTimeFrom = e.target.value;
                  if (timeToValue && timeToValue <= newTimeFrom) {
                    handleChange({ target: { name: "time_to", value: "" } }); // clear time_to
                  }
                }
              }}
              required
              placeholder=" "
              disabled={field === "time_to" && !timeFromValue} // disable time_to if no time_from
            >
              <option value="">Select Time</option>
              {filteredTimeOptions.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
            <label
              className={
                aidRequest[field] !== "" && aidRequest[field] !== undefined
                  ? "active"
                  : ""
              }
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "classrooms_allocated":
        return (
          <div key={field} className={getClassName()}>
            <Select
              isMulti
              name={field}
              options={classroomOptions}
              value={classroomOptions.filter(
                (opt) =>
                  Array.isArray(aidRequest.classrooms_allocated) &&
                  aidRequest.classrooms_allocated.includes(opt.value)
              )}
              onChange={(selected) =>
                setAidRequest((prev) => ({
                  ...prev,
                  classrooms_allocated: selected.map((s) => s.value),
                }))
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={
                isFocused || aidRequest.classrooms_allocated.length > 0
                  ? "active"
                  : ""
              }
              htmlFor={field}
            >
              Classrooms Requested (optional)
            </label>
          </div>
        );

      case "exam_or_not":
        return (
          <div key={field} className={getClassName()}>
            <Select
              name={field}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              value={{
                value: aidRequest.exam_or_not,
                label: aidRequest.exam_or_not,
              }}
              onChange={(selected) =>
                setAidRequest((prev) => ({
                  ...prev,
                  exam_or_not: selected.value,
                }))
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || aidRequest.exam_or_not ? "active" : ""}
              htmlFor={field}
            >
              Exam or Not
            </label>
          </div>
        );

      default:
        return (
          <div key={field} className={getClassName()}>
            <input
              type={field === "no_of_participants" ? "number" : "text"}
              name={field}
              value={aidRequest[field]}
              onChange={handleChange}
              min="1"
              required
              placeholder=" "
            />
            <label htmlFor={field}>{label}</label>
          </div>
        );
    }
  };

  const renderAidItemField = (field, item, index, handleChange, handleBlur) => {
    const label = field.replaceAll("_", " ");
    const isAuditoriumOrMisc =
      item.description.toLowerCase() === "auditorium" || item.item_no === "14";

    const shouldShowCTMFields =
      aidRequest.paid_course_or_not === "Yes" && item.item_no === "03";

    switch (field) {
      case "item_no":
        return (
          <div key={field} className="form-step">
            <Select
              name={field}
              options={Array.from({ length: 14 }, (_, i) => {
                const value = (i + 1).toString().padStart(2, "0");
                const description = itemDescriptionMapping[value] || "";
                return {
                  value,
                  label: `${value} (${description})`,
                };
              })}
              value={
                item[field] ? { value: item[field], label: item[field] } : null
              }
              onChange={(selected) =>
                handleChange(index, {
                  target: { name: field, value: selected.value },
                })
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || item[field] !== "" ? "active" : ""}
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "description":
        return (
          <div key={field} className="form-step">
            <input
              type="text"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              onBlur={(e) => handleBlur(index, e)}
              readOnly={item.item_no !== "14"}
              required
              placeholder=" "
            />
            <label htmlFor={field}>{label}</label>
          </div>
        );

      case "quantity":
        return (
          <div key={field} className="form-step">
            <input
              type="number"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              min="1"
              required
              placeholder=" "
            />
            <label htmlFor={field}>{label}</label>
          </div>
        );

      case "md_approval_required_or_not":
        if (!isAuditoriumOrMisc) return null;
        return (
          <div key={field} className="form-step">
            <Select
              name={field}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              value={{ value: item[field], label: item[field] }}
              onChange={(selected) =>
                handleChange(index, {
                  target: { name: field, value: selected.value },
                })
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || item[field] ? "active" : ""}
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "md_approval_obtained":
        if (!isAuditoriumOrMisc) return null;
        return (
          <div key={field} className="form-step">
            <Select
              name={field}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              value={
                item[field] ? { value: item[field], label: item[field] } : null
              }
              onChange={(selected) =>
                handleChange(index, {
                  target: { name: field, value: selected.value },
                })
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || item[field] ? "active" : ""}
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "md_approval_details": {
        if (!isAuditoriumOrMisc) return null;
        return (
          <div key={field} className="form-step">
            <input
              type="text"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              required
              placeholder=" "
            />
            <label htmlFor={field}>{label}</label>
          </div>
        );
      }

      case "CTM_approval_obtained":
        if (!shouldShowCTMFields) return null;
        return (
          <div key={field} className="form-step">
            <Select
              name={field}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              value={
                item[field] ? { value: item[field], label: item[field] } : null
              }
              onChange={(selected) =>
                handleChange(index, {
                  target: { name: field, value: selected.value },
                })
              }
              placeholder=" "
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <label
              className={isFocused || item[field] ? "active" : ""}
              htmlFor={field}
            >
              {label}
            </label>
          </div>
        );

      case "CTM_Details":
        if (!shouldShowCTMFields) return null;
        return (
          <div key={field} className="form-step">
            <input
              type="text"
              name={field}
              value={item[field] || ""}
              onChange={(e) => handleChange(index, e)}
              required={shouldShowCTMFields}
              placeholder=" "
            />
            <label htmlFor={field}>{label}</label>
          </div>
        );

      default:
        return (
          <div key={field} className="form-step">
            <input
              type="text"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              required
              placeholder=" "
            />
            <label htmlFor={field}>{label}</label>
          </div>
        );
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 1: Requesting Officer & Course Details
            </p>
            <div className="step-two-grid">
              {[
                "requesting_officer_name",
                "designation",
                "requesting_officer_email",
                "course_name",
                "duration",
                "audience_type",
              ].map((field) =>
                renderAidRequestField(
                  field,
                  aidRequest,
                  handleAidRequestChange,
                  today,
                  timeOptions,
                  handlePreferredDaysChange,
                  groupedCourseOptions,
                  dayOptions,
                  classroomOptions
                )
              )}
            </div>
          </>
        );
      case 2:
        return (
          <>
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 2: Participants, Coordinator & Date/Time
            </p>
            <div className="step-two-grid">
              {[
                "no_of_participants",
                "course_coordinator",
                "date_from",
                "date_to",
                "time_from",
                "time_to",
              ].map((field) =>
                renderAidRequestField(
                  field,
                  aidRequest,
                  handleAidRequestChange,
                  today,
                  timeOptions,
                  handlePreferredDaysChange,
                  groupedCourseOptions,
                  dayOptions,
                  classroomOptions
                )
              )}
            </div>
          </>
        );
      case 3:
        return (
          <>
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 3: Preferences & Sign-Off
            </p>
            <div className="centered-form-section">
              {[
                "preferred_days_of_week",
                "paid_course_or_not",
                "signed_date",
                "classrooms_allocated",
                "exam_or_not",
              ].map((field) =>
                renderAidRequestField(
                  field,
                  aidRequest,
                  handleAidRequestChange,
                  today,
                  timeOptions,
                  handlePreferredDaysChange,
                  groupedCourseOptions,
                  dayOptions,
                  classroomOptions
                )
              )}
            </div>
          </>
        );
      case 4:
        return (
          <>
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 4: Add Aid Items
            </p>
            {aidItems.map((item, index) => (
              <div key={index} className="aid-item">
                <div className="step-two-grid">
                  {Object.keys(item).map((field) =>
                    renderAidItemField(
                      field,
                      item,
                      index,
                      handleAidItemChange,
                      handleAidItemBlur
                    )
                  )}
                </div>
                <button
                  type="button"
                  className="add-itemsbtn"
                  onClick={() => removeAidItem(index)}
                >
                  Remove Item
                </button>
              </div>
            ))}
            <button type="button" className="add-itemsbtn" onClick={addAidItem}>
              Add Item
            </button>
          </>
        );
      case 5:
        return (
          <>
            <p
              className="page-description-type2"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Step 5: Confirm your details and submit
            </p>
            <div className="review-grid-1">
              {Object.entries(aidRequest).map(([key, val]) =>
                key !== "request_status" &&
                key !== "payment_status" &&
                key !== "cancelled_by_requester" ? (
                  <p key={key}>
                    <strong>
                      {key === "classrooms_allocated"
                        ? "Classroom(s) Requested"
                        : key.replaceAll("_", " ")}
                      :
                    </strong>{" "}
                    {val === null ||
                    val === undefined ||
                    val === "" ||
                    (Array.isArray(val) && val.length === 0)
                      ? "-"
                      : Array.isArray(val)
                      ? val.join(", ")
                      : val}
                  </p>
                ) : null
              )}
            </div>
            <div className="review-items">
              {aidItems.length > 0 && (
                <>
                  <p
                    className="page-description-type2"
                    style={{
                      fontWeight: "bold",
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    Aid Items:
                  </p>
                  {aidItems.map((item, index) => (
                    <div key={index} style={{ gridColumn: "1 / -1" }}>
                      {Object.entries(item).map(([key, val]) => {
                        const shouldShowCTMFields =
                          aidRequest.paid_course_or_not === "Yes" &&
                          item.item_no === "03";

                        const isAuditoriumOrMisc =
                          item.description.toLowerCase().trim() ===
                            "auditorium" || item.item_no === "14";

                        // Skip CTM fields if condition not met
                        if (
                          (key === "CTM_approval_obtained" ||
                            key === "CTM_Details") &&
                          !shouldShowCTMFields
                        ) {
                          return null;
                        }

                        if (
                          (key === "md_approval_required_or_not" ||
                            key === "md_approval_obtained" ||
                            key === "md_approval_details") &&
                          !isAuditoriumOrMisc
                        ) {
                          return null;
                        }
                        const displayValue =
                          (key === "md_approval_details" ||
                            key === "CTM_Details") &&
                          (!val || !val.trim())
                            ? "-"
                            : val;

                        return (
                          <p key={key}>
                            <strong>{key.replaceAll("_", " ")}:</strong>{" "}
                            {displayValue}
                          </p>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "transparent",
      borderColor: state.isFocused ? "#01eeff" : "#00a6ff9d",
      borderWidth: 3,
      borderRadius: 4,
      padding: "0px",
      minHeight: "32px", // Shrinks overall height
      boxShadow: "none",
      cursor: "pointer",
      color: "#e3eaf5",
      fontSize: "12px",
      "&:hover": {
        borderColor: "#01eeff",
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "2px 6px",
      fontSize: "12px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#999",
      fontSize: "12px",
    }),
    input: (provided) => ({
      ...provided,
      color: "#fff",
      fontSize: "12px",
      margin: 0,
      padding: 0,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#fff",
      fontSize: "12px",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#003b5a",
      color: "#e3eaf5",
      borderRadius: 4,
      fontSize: "10px", // Menu font size can stay small
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#01eeff" : "transparent",
      color: state.isFocused ? "black" : "#e3eaf5",
      cursor: "pointer",
      fontSize: "12px",
      padding: "6px 10px", // Still gives clickable area
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#00fff253",
      borderRadius: 4,
      fontSize: "11px",
      margin: "2px 4px",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#fff",
      fontSize: "11px",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#fff",
      fontSize: "11px",
      ":hover": {
        backgroundColor: "#01eeff",
        color: "black",
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "8.8px 7px",
      svg: {
        width: "16px", // reduce arrow size
        height: "16px",
      },
    }),

    clearIndicator: (provided) => ({
      ...provided,
      padding: "8.8px 7px",
      svg: {
        width: "16px", // reduce × icon size
        height: "16px",
      },
    }),
  };

  const [isFocused, setIsFocused] = useState(false);

  const hasValue = !!aidRequest.course_name;

  return (
    <>
      {successMessage && <SuccessPopup message={successMessage} />}
      <form
        onSubmit={handleSubmit}
        className="aid-request-form-type2"
        id="aidh2"
      >
        <div className="page-header">
          <h1>Create Classroom/Aid Request</h1>
        </div>

        <div className="progressbar-container">
          {[...Array(totalSteps)].map((_, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            return (
              <React.Fragment key={stepNum}>
                <div
                  className={`progress-step ${isActive ? "active" : ""} ${
                    isCompleted ? "completed" : ""
                  }`}
                >
                  <div className="circle">{stepNum}</div>
                </div>
                {stepNum !== totalSteps && (
                  <div
                    className={`line ${isCompleted ? "completed" : ""}`}
                  ></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {renderStep()}

        <div className="form-buttons-sticky">
          <div className="navigation-buttons">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep}>
                Back
              </button>
            )}
            {currentStep < totalSteps && (
              <button type="button" onClick={nextStep}>
                Next
              </button>
            )}
            {currentStep === totalSteps && (
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Aid Request"}
              </button>
            )}
          </div>

          <div className="button-section-aid_req">
            <button
              type="button"
              className="clsrform"
              onClick={() =>
                clearAndRefresh(["aidRequestData", "aidItemsData"])
              }
            >
              Clear Request Form
            </button>
            <button
              type="button"
              className="clsrform"
              onClick={() => navigate("/cancelRequestByUser")}
            >
              Cancel Booked Request
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AidRequestForm;
