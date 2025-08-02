import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ClassroomBookingForm.css";
import { authRequest } from "../../services/authService";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { getApiUrl } from "../../../utils/apiUrl";

const ClassroomBookingForm = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );
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
  });
  const [aidItems, setAidItems] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  // Mapping between item number and description
  const itemDescriptionMapping = {
    "01": "Auditorium",
    "02": "Multimedia projector",
    "03": "Classroom",
    "04": "Chalk board & Duster",
    "05": "White Board & Cleaning Pad",
    "06": "Flip Chart papers",
    "07": "Chart Stand",
    "08": "Flannel Board",
    "09": "Overhead Projector",
    10: "Extension Cables",
    11: "Magnets",
    12: "Marker Pens",
    13: "Screen",
    14: "Miscellaneous items",
  };

  const groupedCourseOptions = [
    {
      label: "MARITIME COURSES",
      options: [
        {
          value: "Proficiency in Personal Survival Techniques",
          label: "Proficiency in Personal Survival Techniques",
        },
        {
          value: "Proficiency in Fire Prevention & Fire Fighting",
          label: "Proficiency in Fire Prevention & Fire Fighting",
        },
        {
          value: "Proficiency in Elementary First Aid",
          label: "Proficiency in Elementary First Aid",
        },
        {
          value: "Proficiency in Personal Safety and Social Responsibility",
          label: "Proficiency in Personal Safety and Social Responsibility",
        },
        {
          value:
            "Proficiency in Security Training for Seafarers with Designated Security Duties (SDSD)",
          label:
            "Proficiency in Security Training for Seafarers with Designated Security Duties (SDSD)",
        },
        {
          value: "Proficiency in Basic Trauma",
          label: "Proficiency in Basic Trauma",
        },
        {
          value:
            "Refresher and Updating Course for Seafarers (PST / FPFF / EFA / PSSR)",
          label:
            "Refresher and Updating Course for Seafarers (PST / FPFF / EFA / PSSR)",
        },
        { value: "Maritime English", label: "Maritime English" },
        { value: "Rigging Course", label: "Rigging Course" },
        {
          value: "Winchman Training Course",
          label: "Winchman Training Course",
        },
        {
          value: "Basic Training for Oil and Chemical Tanker Cargo Operation",
          label: "Basic Training for Oil and Chemical Tanker Cargo Operation",
        },
        {
          value: "Coxswain with License Fee",
          label: "Coxswain with License Fee",
        },
        {
          value: "Pre Sea Training Course for Deck Rating",
          label: "Pre Sea Training Course for Deck Rating",
        },
        { value: "Boat Master", label: "Boat Master" },
      ],
    },
    {
      label: "ELECTRICAL COURSES",
      options: [
        { value: "Motor Control Circuits", label: "Motor Control Circuits" },
        { value: "Electrical Wireman", label: "Electrical Wireman" },
        {
          value: "Mechatronic for Beginners",
          label: "Mechatronic for Beginners",
        },
        {
          value: "Programmable Logic Controller (P.L.C)",
          label: "Programmable Logic Controller (P.L.C)",
        },
      ],
    },
    {
      label: "MANAGEMENT & I/S COURSES",
      options: [
        {
          value: "Computer Basic MS Office",
          label: "Computer Basic MS Office",
        },
        {
          value: "Computer Advanced MS Office – (Internal)",
          label: "Computer Advanced MS Office – (Internal)",
        },
        {
          value: "Computer Advanced MS Office – (External)",
          label: "Computer Advanced MS Office – (External)",
        },
        {
          value: "Computer Application Assistant (NVQ – L 3)",
          label: "Computer Application Assistant (NVQ – L 3)",
        },
      ],
    },
    {
      label: "EQUIPMENT TRAINING COURSES",
      options: [
        {
          value: "Private Heavy Vehicle Programme",
          label: "Private Heavy Vehicle Programme",
        },
        {
          value:
            "Refresher Courses for Drivers & Operators - Prime Mover Operator",
          label:
            "Refresher Courses for Drivers & Operators - Prime Mover Operator",
        },
        {
          value:
            "Refresher Courses for Drivers & Operators - Forklift & Goods Carriers",
          label:
            "Refresher Courses for Drivers & Operators - Forklift & Goods Carriers",
        },
        {
          value:
            "Refresher Courses for Drivers & Operators - Light Vehicle & Motor Coucher",
          label:
            "Refresher Courses for Drivers & Operators - Light Vehicle & Motor Coucher",
        },
        {
          value: "Trade Test (Fork Lift / Prime Mover / Mobile Crane)",
          label: "Trade Test (Fork Lift / Prime Mover / Mobile Crane)",
        },
        {
          value: "NVQ Trial Test (Forklift / Prime Mover)",
          label: "NVQ Trial Test (Forklift / Prime Mover)",
        },
        { value: "Mobile Crane Operator", label: "Mobile Crane Operator" },
        {
          value: "Forklift Truck Operator – (NVQ – L3)",
          label: "Forklift Truck Operator – (NVQ – L3)",
        },
        {
          value: "Prime Mover Operator – (NVQ – L4)",
          label: "Prime Mover Operator – (NVQ – L4)",
        },
        { value: "Top Lift Truck Operator", label: "Top Lift Truck Operator" },
        { value: "Gantry Crane Operator", label: "Gantry Crane Operator" },
        { value: "Transfer Crane Operator", label: "Transfer Crane Operator" },
      ],
    },
  ];

  const today = new Date().toISOString().split("T")[0];

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      ["00", "30"].forEach((minute) => {
        const time = `${hour.toString().padStart(2, "0")}:${minute}`;
        times.push(time);
      });
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const dayOptions = [
    { value: "Mon", label: "Mon" },
    { value: "Tue", label: "Tue" },
    { value: "Wed", label: "Wed" },
    { value: "Thu", label: "Thu" },
    { value: "Fri", label: "Fri" },
    { value: "Sat", label: "Sat" },
    { value: "Sun", label: "Sun" },
  ];

  // New state for aid handover form
  const [aidHandover, setAidHandover] = useState({
    request_id: "",
    items_taken_over: "",
    items_returned: "",
    receiver_name: "",
    receiver_designation: "",
    receiver_date: "",
    handover_confirmer_name: "",
    handover_confirmer_designation: "",
    handover_confirmer_date: "",
  });

  const [hasLoadedAidRequest, setHasLoadedAidRequest] = useState(false);
  const [hasLoadedAidHandover, setHasLoadedAidHandover] = useState(false);
  const [handoverRestoredFromLocal, setHandoverRestoredFromLocal] =
    useState(false);

  useEffect(() => {
    const savedAidRequest = localStorage.getItem("aidRequestData");
    const savedAidItems = localStorage.getItem("aidItemsData");
    const savedAidHandover = localStorage.getItem("aidHandoverData");

    if (savedAidRequest) {
      try {
        const parsedRequest = JSON.parse(savedAidRequest);
        setAidRequest(parsedRequest);
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
        setAidItems(parsedItems);
        console.log("Restored aidItemsData from localStorage:", parsedItems);
      } catch (e) {
        console.error("Failed to parse aidItemsData:", e);
      }
    }

    if (savedAidHandover) {
      try {
        const parsedHandover = JSON.parse(savedAidHandover);
        setAidHandover(parsedHandover);
        setHandoverRestoredFromLocal(true);
        console.log(
          "Restored aidHandoverData from localStorage:",
          parsedHandover
        );
      } catch (e) {
        console.error("Failed to parse aidHandoverData:", e);
      }
    }

    setHasLoadedAidRequest(true);
    setHasLoadedAidHandover(true);
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

  useEffect(() => {
    if (hasLoadedAidHandover) {
      localStorage.setItem("aidHandoverData", JSON.stringify(aidHandover));
      console.log("Saved aidHandoverData to localStorage:", aidHandover);
    }
  }, [aidHandover, hasLoadedAidHandover]);

  const clearAndRefresh = (keys) => {
    if (
      window.confirm("Are you sure you want to clear saved data and refresh?")
    ) {
      keys.forEach((key) => localStorage.removeItem(key));
      console.log("Cleared localStorage keys:", keys);
      window.location.reload(); // triggers a full page reload
    }
  };

  useEffect(() => {
    // Always sync sidebar state from localStorage on mount and on popstate
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState");
      if (stored !== null) {
        const isCollapsed = stored === "true";
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: { isCollapsed },
          })
        );
      }
    };

    // On mount, sync sidebar state
    syncSidebarState();

    // Listen for browser back/forward navigation and sync sidebar state
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

  const handlePreferredDaysChange = (selectedOptions) => {
    const selectedValues = selectedOptions.map((opt) => opt.value);
    setAidRequest((prev) => ({
      ...prev,
      preferred_days_of_week: selectedValues,
    }));
  };

  const handleAidItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...aidItems];
    updatedItems[index][name] = value;

    if (name === "item_no") {
      if (value === "14") {
        updatedItems[index].description = "";
      } else {
        updatedItems[index].description = itemDescriptionMapping[value];
      }
    } else if (name === "description") {
      // <-- modified: don't auto-add (miscellaneous) while typing
      updatedItems[index].description = value;
    }

    setAidItems(updatedItems);
  };

  const handleAidItemBlur = (index, e) => {
    // <-- new function
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

  const addAidItem = () => {
    setAidItems((prev) => [
      ...prev,
      {
        item_no: "01",
        description: itemDescriptionMapping["01"],
        quantity: "1",
        remark: "",
      },
    ]);
  };

  const removeAidItem = (index) => {
    setAidItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert preferred_days_of_week array to a comma-separated string
    const updatedAidRequest = {
      ...aidRequest,
      preferred_days_of_week: aidRequest.preferred_days_of_week.join(","),
      payment_status:
        aidRequest.paid_course_or_not === "Yes" ? "pending" : "Not Set",
    };

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

      setSuccessMessage("Aid Request created successfully!");
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
        preferred_days_of_week: [], // Keep it as an array for UI
        paid_course_or_not: "No",
        payment_status: "Not Set",
        signed_date: "",
        request_status: "pending",
      });
      setAidItems([]);
      localStorage.removeItem("aidRequestData");
      localStorage.removeItem("aidItemsData");
      console.log("Cleared aidRequestData and aidItemsData from localStorage");
    } catch (err) {
      console.error("Error creating aid request:", err);
    }
  };

  const handleAidHandoverChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("date")) {
      const selectedDate = new Date(value);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // Check if the selected date is in the past
      if (name !== "receiver_date" && selectedDate < todayDate) {
        alert("You cannot select a past date.");
        return;
      }

      // If the field is `receiver_date`, compare with `handover_confirmer_date`
      if (name === "receiver_date" && aidHandover.handover_confirmer_date) {
        const handoverConfirmerDate = new Date(
          aidHandover.handover_confirmer_date
        );

        if (selectedDate > handoverConfirmerDate) {
          alert(
            "Receiver date cannot be later than the handover confirmer date."
          );
          return;
        }
      }

      // If the field is `handover_confirmer_date`, compare with `receiver_date`
      if (name === "handover_confirmer_date" && aidHandover.receiver_date) {
        const receiverDate = new Date(aidHandover.receiver_date);

        if (selectedDate < receiverDate) {
          alert(
            "Handover confirmer date cannot be earlier than the receiver date."
          );
          return;
        }
      }
    }

    setAidHandover((prev) => ({ ...prev, [name]: value }));
  };

  const fetchAidHandoverByRequestId = async (requestId) => {
    if (!requestId) return;

    try {
      const response = await authRequest(
        "get",
        getApiUrl(`/aidhandover/request/${requestId}`)
      );
      if (response && !response.error) {
        setAidHandover({
          request_id: requestId,
          items_taken_over: response.items_taken_over || "",
          items_returned: response.items_returned || "",
          receiver_name: response.receiver_name || "",
          receiver_designation: response.receiver_designation || "",
          receiver_date: response.receiver_date || "",
          handover_confirmer_name: response.handover_confirmer_name || "",
          handover_confirmer_designation:
            response.handover_confirmer_designation || "",
          handover_confirmer_date: response.handover_confirmer_date || "",
        });
      } else {
        setAidHandover((prev) => ({
          ...prev,
          items_taken_over: "",
          items_returned: "",
          receiver_name: "",
          receiver_designation: "",
          receiver_date: "",
          handover_confirmer_name: "",
          handover_confirmer_designation: "",
          handover_confirmer_date: "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch aid handover:", err);
    }
  };

  // Debounce hook to reduce frequent calls on fast typing (optional but recommended)
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    React.useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  }

  const debouncedRequestId = useDebounce(aidHandover.request_id, 500);

  useEffect(() => {
    if (!handoverRestoredFromLocal && debouncedRequestId) {
      fetchAidHandoverByRequestId(debouncedRequestId);
    }
  }, [debouncedRequestId, handoverRestoredFromLocal]);

  const handleAidHandoverSave = async (e) => {
    e.preventDefault();

    if (!aidHandover.request_id) {
      alert("Please enter a valid Request ID");
      return;
    }

    try {
      await authRequest(
        "patch",
        getApiUrl("/aidhandover"),
        aidHandover
      );
      setSuccessMessage("Aid Handover saved successfully!");

      // Optionally reset form if needed
      setAidHandover({
        request_id: "",
        items_taken_over: "",
        items_returned: "",
        receiver_name: "",
        receiver_designation: "",
        receiver_date: "",
        handover_confirmer_name: "",
        handover_confirmer_designation: "",
        handover_confirmer_date: "",
      });
      localStorage.removeItem("aidHandoverData");
      setHandoverRestoredFromLocal(false);
      console.log("Cleared aidHandoverData from localStorage");
    } catch (err) {
      console.error("Error saving aid handover:", err);
      setSuccessMessage("Error saving aid handover");
    }
  };

  const handleDeleteHandover = async (id) => {
    try {
      await authRequest(
        "delete",
        getApiUrl(`/aidhandover/request/${id}`)
      );
      setSuccessMessage("Aid Handover deleted successfully!");
    } catch (err) {
      console.error("Error deleting aid handover:", err);
    }
  };

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

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? "expanded" : ""}`}>
      {successMessage && <SuccessPopup message={successMessage} />}
      <form onSubmit={handleSubmit} className="aid-request-form">
        <div className="page-header">
          <svg
            className="icon"
            xmlns="https://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h1>Create Classroom/Aid Request</h1>
        </div>
        <p className="page-description" style={{ fontWeight: "bold" }}>
          Create Classroom/Aid Request through this form.
        </p>
        {Object.keys(aidRequest).map(
          (field, idx) =>
            field !== "request_status" &&
            field !== "payment_status" && (
              <div key={idx}>
                <label>{field.replaceAll("_", " ")}</label>

                {/* Handling the fields for request details */}
                {field === "signed_date" ? (
                  <input
                    type="date"
                    name={field}
                    value={aidRequest[field]}
                    min={today}
                    onChange={handleAidRequestChange}
                    required
                  />
                ) : field === "course_name" ? (
                  <CreatableSelect
                    isClearable
                    options={groupedCourseOptions}
                    onChange={(selectedOption) =>
                      setAidRequest((prev) => ({
                        ...prev,
                        course_name: selectedOption ? selectedOption.value : "",
                      }))
                    }
                    value={
                      aidRequest.course_name
                        ? {
                            label: aidRequest.course_name,
                            value: aidRequest.course_name,
                          }
                        : null
                    }
                    placeholder="Select or type a course name"
                  />
                ) : field === "preferred_days_of_week" ? (
                  <Select
                    isMulti
                    name={field}
                    options={dayOptions}
                    value={
                      Array.isArray(aidRequest[field])
                        ? dayOptions.filter((option) =>
                            aidRequest[field].includes(option.value)
                          )
                        : []
                    }
                    onChange={handlePreferredDaysChange}
                  />
                ) : field === "paid_course_or_not" ? (
                  <select
                    name={field}
                    value={aidRequest[field]}
                    onChange={handleAidRequestChange}
                    required
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                ) : field === "payment_status" ? (
                  <input
                    type="text"
                    name={field}
                    value={aidRequest[field] || "Not Set"}
                    readOnly
                  />
                ) : field === "date_from" || field === "date_to" ? (
                  <input
                    type="date"
                    name={field}
                    value={aidRequest[field]}
                    min={today}
                    onChange={handleAidRequestChange}
                    required
                  />
                ) : field === "time_from" || field === "time_to" ? (
                  <select
                    name={field}
                    value={aidRequest[field]}
                    onChange={handleAidRequestChange}
                    required
                  >
                    <option value="">Select Time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                ) : field === "request_status" ? (
                  <input
                    type="text"
                    name={field}
                    value={aidRequest[field] || "pending"}
                    readOnly
                  />
                ) : (
                  <input
                    type={field === "no_of_participants" ? "number" : "text"}
                    name={field}
                    value={aidRequest[field]}
                    onChange={handleAidRequestChange}
                    min="1"
                    required={field !== "request_status"}
                  />
                )}
              </div>
            )
        )}

        <p className="page-description" style={{ fontWeight: "bold" }}>
          Add items to your request before submitting request.
        </p>
        {aidItems.map((item, index) => (
          <div key={index} className="aid-item">
            {Object.keys(item).map((field, idx) => (
              <div key={idx}>
                <label>{field.replaceAll("_", " ")}</label>

                {/* Handling Item-specific Fields */}
                {field === "item_no" ? (
                  <select
                    name={field}
                    value={item[field]}
                    onChange={(e) => handleAidItemChange(index, e)}
                    required
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num.toString().padStart(2, "0")}>
                        {num.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                ) : field === "description" ? (
                  item.item_no === "14" ? (
                    <input
                      type="text"
                      name={field}
                      value={item[field]}
                      onChange={(e) => handleAidItemChange(index, e)}
                      onBlur={(e) => handleAidItemBlur(index, e)}
                      required
                    />
                  ) : (
                    <input
                      type="text"
                      name={field}
                      value={item[field]}
                      readOnly
                    />
                  )
                ) : field === "quantity" ? (
                  <input
                    type="number"
                    name={field}
                    value={item[field]}
                    onChange={(e) => handleAidItemChange(index, e)}
                    min="1"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    name={field}
                    value={item[field]}
                    onChange={(e) => handleAidItemChange(index, e)}
                    required
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              className="clsrform"
              onClick={() => removeAidItem(index)}
            >
              Remove Item
            </button>
          </div>
        ))}
        <div className="button-section-aid_req">
          <button type="button" className="clsrform" onClick={addAidItem}>
            Add Item
          </button>

          <button
            className="clsrform"
            onClick={() => clearAndRefresh(["aidRequestData", "aidItemsData"])}
          >
            Clear Aid Request & Refresh
          </button>

          <button type="submit" className="clsrform">
            Submit Aid Request
          </button>
        </div>
      </form>

      {/* Combined Create & Update Form */}
      <form onSubmit={handleAidHandoverSave} className="aid-request-form">
        <div className="page-header">
          <h1>Handover Details Form</h1>
        </div>
        <p className="page-description" style={{ fontWeight: "bold" }}>
          Fill out this form to submit or update Handover Details.
        </p>

        <div>
          <label>Request ID (required for create or update)</label>
          <input
            type="number"
            name="request_id"
            value={aidHandover.request_id}
            onChange={handleAidHandoverChange}
            placeholder="Enter Request ID for update"
            required
          />
        </div>

        {Object.keys(aidHandover)
          .filter((field) => field !== "request_id")
          .map((field, idx) => (
            <div key={idx}>
              <label>{field.replaceAll("_", " ")}</label>
              {field.includes("date") ? (
                <input
                  type="date"
                  name={field}
                  value={aidHandover[field]}
                  onChange={handleAidHandoverChange}
                  {...(field !== "receiver_date" ? { min: today } : {})}
                  required
                />
              ) : (
                <input
                  type="text"
                  name={field}
                  value={aidHandover[field]}
                  onChange={handleAidHandoverChange}
                  required={field !== "items_returned"} // optional
                />
              )}
            </div>
          ))}

        <div className="button-section-aid_req">
          <button
            className="clsrform"
            onClick={() => clearAndRefresh(["aidHandoverData"])}
          >
            Clear Aid Handover & Refresh
          </button>

          <button type="submit" className="clsrform">
            Submit Handover
          </button>
        </div>
      </form>

      {/* Delete Section */}
      <form className="aid-request-form">
        <div className="delete-section">
          <p className="page-description" style={{ fontWeight: "bold" }}>
            Provide the Request ID to Delete Handover Details.
          </p>
          <label>Request ID</label>
          <input
            type="number"
            id="deleteHandoverId"
            placeholder="Enter Request ID"
          />
          <button
            className="clsrform"
            onClick={() => {
              const id = document.getElementById("deleteHandoverId").value;
              handleDeleteHandover(id);
            }}
          >
            Delete Aid Handover
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassroomBookingForm;
