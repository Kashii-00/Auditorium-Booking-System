import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Building,
  Check,
  XCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
} from "lucide-react";
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
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-lg">{message}</p>
          <p className="text-emerald-100 text-sm">Your action has been completed successfully</p>
        </div>
      </div>
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
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select course..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "preferred_days_of_week":
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select preferred days..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "paid_course_or_not":
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select option..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "audience_type":
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select audience type..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
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
          type: "date",
          min: today,
          className: "border-2 border-slate-200 focus:border-blue-500 rounded-lg",
        };

        if (field === "date_to") {
          inputProps.disabled = !dateFrom;
          if (dateFrom) inputProps.min = dateFrom;
        }

        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
            <Input {...inputProps} />
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
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              disabled={field === "time_to" && !timeFromValue} // disable time_to if no time_from
              className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select Time</option>
              {filteredTimeOptions.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "classrooms_allocated":
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Classrooms Requested (optional)
            </label>
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
              placeholder="Select classrooms..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "exam_or_not":
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Exam or Not
            </label>
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
              placeholder="Select option..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      default:
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
            <Input
              type={field === "no_of_participants" ? "number" : "text"}
              name={field}
              value={aidRequest[field]}
              onChange={handleChange}
              min="1"
              required
              placeholder={`Enter ${label.toLowerCase()}`}
              className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
            />
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
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select item..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "description":
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
            <Input
              type="text"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              onBlur={(e) => handleBlur(index, e)}
              readOnly={item.item_no !== "14"}
              required
              placeholder="Enter description..."
              className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
            />
          </div>
        );

      case "quantity":
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
            <Input
              type="number"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              min="1"
              required
              placeholder="Enter quantity..."
              className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
            />
          </div>
        );

      case "md_approval_required_or_not":
        if (!isAuditoriumOrMisc) return null;
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select option..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "md_approval_obtained":
        if (!isAuditoriumOrMisc) return null;
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select option..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "md_approval_details": {
        if (!isAuditoriumOrMisc) return null;
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
            <Input
              type="text"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              required
              placeholder="Enter approval details..."
              className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
            />
          </div>
        );
      }

      case "CTM_approval_obtained":
        if (!shouldShowCTMFields) return null;
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
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
              placeholder="Select option..."
              styles={customSelectStyles}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case "CTM_Details":
        if (!shouldShowCTMFields) return null;
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
            <Input
              type="text"
              name={field}
              value={item[field] || ""}
              onChange={(e) => handleChange(index, e)}
              required={shouldShowCTMFields}
              placeholder="Enter CTM details..."
              className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
            />
          </div>
        );

      default:
        return (
          <div key={field} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 capitalize">
              {label}
            </label>
            <Input
              type="text"
              name={field}
              value={item[field]}
              onChange={(e) => handleChange(index, e)}
              required
              placeholder={`Enter ${label.toLowerCase()}`}
              className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
            />
          </div>
        );
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Step 1: Requesting Officer & Course Details
              </h2>
              <p className="text-slate-600 mt-2">Please provide the basic information about the requesting officer and course</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Step 2: Participants, Coordinator & Date/Time
              </h2>
              <p className="text-slate-600 mt-2">Provide participant details and schedule information</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Step 3: Preferences & Sign-Off
              </h2>
              <p className="text-slate-600 mt-2">Set your preferences and complete the sign-off process</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Step 4: Add Aid Items
              </h2>
              <p className="text-slate-600 mt-2">Add the required aid items for your request</p>
            </div>
            <div className="space-y-6">
              {aidItems.map((item, index) => (
                <Card key={index} className="border border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">Item {index + 1}</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAidItem(index)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  </CardContent>
                </Card>
              ))}
              <div className="text-center">
                <Button
                  type="button"
                  onClick={addAidItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Step 5: Confirm your details and submit
              </h2>
              <p className="text-slate-600 mt-2">Review all information before submitting your request</p>
            </div>
            <div className="space-y-6">
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-800">Request Details</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(aidRequest).map(([key, val]) =>
                      key !== "request_status" &&
                      key !== "payment_status" &&
                      key !== "cancelled_by_requester" ? (
                        <div key={key} className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-600 capitalize">
                            {key === "classrooms_allocated"
                              ? "Classroom(s) Requested"
                              : key.replaceAll("_", " ")}
                          </span>
                          <span className="text-sm text-slate-800 mt-1">
                            {val === null ||
                            val === undefined ||
                            val === "" ||
                            (Array.isArray(val) && val.length === 0)
                              ? "-"
                              : Array.isArray(val)
                              ? val.join(", ")
                              : val}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </CardContent>
              </Card>

              {aidItems.length > 0 && (
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-800">Aid Items</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aidItems.map((item, index) => (
                        <div key={index} className="border border-slate-100 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-700 mb-3">Item {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                <div key={key} className="flex flex-col">
                                  <span className="text-sm font-semibold text-slate-600 capitalize">
                                    {key.replaceAll("_", " ")}
                                  </span>
                                  <span className="text-sm text-slate-800 mt-1">
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
      backgroundColor: "white",
      borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
      borderWidth: "2px",
      borderRadius: "8px",
      padding: "8px 12px",
      minHeight: "44px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      cursor: "pointer",
      color: "#1e293b",
      fontSize: "14px",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0px",
      fontSize: "14px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#94a3b8",
      fontSize: "14px",
    }),
    input: (provided) => ({
      ...provided,
      color: "#1e293b",
      fontSize: "14px",
      margin: 0,
      padding: 0,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1e293b",
      fontSize: "14px",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "white",
      color: "#1e293b",
      borderRadius: "8px",
      fontSize: "14px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      border: "1px solid #e2e8f0",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#f1f5f9" : "transparent",
      color: state.isFocused ? "#1e293b" : "#475569",
      cursor: "pointer",
      fontSize: "14px",
      padding: "8px 12px",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#dbeafe",
      borderRadius: "6px",
      fontSize: "12px",
      margin: "2px 4px",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#1e40af",
      fontSize: "12px",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#1e40af",
      fontSize: "12px",
      ":hover": {
        backgroundColor: "#bfdbfe",
        color: "#1e40af",
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "8px",
      svg: {
        width: "16px",
        height: "16px",
        color: "#64748b",
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      padding: "8px",
      svg: {
        width: "16px",
        height: "16px",
        color: "#64748b",
      },
    }),
  };

  const [isFocused, setIsFocused] = useState(false);

  const hasValue = !!aidRequest.course_name;

  return (
    <>
      {successMessage && <SuccessPopup message={successMessage} />}
      
      <div className="w-full max-w-9xl mx-auto">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">


          <CardContent className="p-4 xl:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Progress Bar */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  {[...Array(totalSteps)].map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;

                    return (
                      <React.Fragment key={stepNum}>
                        <div className="flex items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                              isActive
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                : isCompleted
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-white border-slate-300 text-slate-500"
                            }`}
                          >
                            {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                          </div>
                          {stepNum !== totalSteps && (
                            <div
                              className={`w-16 h-1 mx-2 transition-all duration-300 ${
                                isCompleted ? "bg-emerald-500" : "bg-slate-200"
                              }`}
                            />
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                {renderStep()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  {currentStep < totalSteps && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  {currentStep === totalSteps && (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Submit Aid Request
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => clearAndRefresh(["aidRequestData", "aidItemsData"])}
                    className="border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-red-600 rounded-xl font-bold"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear Form
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/cancelRequestByUser")}
                    className="border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-orange-600 rounded-xl font-bold"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Request
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AidRequestForm;
