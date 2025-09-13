import React, { useState, useEffect, useRef } from "react";
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
  Package,
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
  const [errorMessage, setErrorMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const timeOptions = generateTimeOptions();

  const [hasLoadedAidRequest, setHasLoadedAidRequest] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [remarkForAll, setRemarkForAll] = useState("");
  const [validDayOptions, setValidDayOptions] = useState(dayOptions);

  // New state for step 4: selected items with checkboxes
  const [selectedItems, setSelectedItems] = useState({});
  const [enableCustomItem, setEnableCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({
    description: "",
    quantity: 1,
    md_approval_required_or_not: "No",
    md_approval_obtained: "No",
    md_approval_details: "",
  });

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
    const savedSelectedItems = localStorage.getItem("selectedItemsData");
    const savedEnableCustomItem = localStorage.getItem("enableCustomItemData");
    const savedCustomItem = localStorage.getItem("customItemData");
    const savedRemarkForAll = localStorage.getItem("remarkForAllData");

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

    if (savedSelectedItems) {
      try {
        const parsedSelected = JSON.parse(savedSelectedItems);
        setSelectedItems(parsedSelected);
        console.log(
          "Restored selectedItemsData from localStorage:",
          parsedSelected
        );
      } catch (e) {
        console.error("Failed to parse selectedItemsData:", e);
      }
    }

    if (savedCustomItem) {
      try {
        const parsedCustom = JSON.parse(savedCustomItem);
        setCustomItem({
          description: parsedCustom.description || "",
          quantity: parsedCustom.quantity || 1,
          md_approval_required_or_not:
            parsedCustom.md_approval_required_or_not || "No",
          md_approval_obtained: parsedCustom.md_approval_obtained || "No",
          md_approval_details: parsedCustom.md_approval_details || "",
        });
        console.log("Restored customItemData from localStorage:", parsedCustom);
      } catch (e) {
        console.error("Failed to parse customItemData:", e);
      }
    }

    if (savedRemarkForAll) {
      try {
        setRemarkForAll(savedRemarkForAll);
        console.log(
          "Restored remarkForAllData from localStorage:",
          savedRemarkForAll
        );
      } catch (e) {
        console.error("Failed to parse remarkForAllData:", e);
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

  useEffect(() => {
    if (hasLoadedAidRequest) {
      localStorage.setItem("selectedItemsData", JSON.stringify(selectedItems));
      console.log("Saved selectedItemsData to localStorage:", selectedItems);
    }
  }, [selectedItems, hasLoadedAidRequest]);

  useEffect(() => {
    if (hasLoadedAidRequest) {
      localStorage.setItem(
        "enableCustomItemData",
        JSON.stringify(enableCustomItem)
      );
      console.log(
        "Saved enableCustomItemData to localStorage:",
        enableCustomItem
      );
    }
  }, [enableCustomItem, hasLoadedAidRequest]);

  useEffect(() => {
    if (hasLoadedAidRequest) {
      localStorage.setItem("customItemData", JSON.stringify(customItem));
      console.log("Saved customItemData to localStorage:", customItem);
    }
  }, [customItem, hasLoadedAidRequest]);

  useEffect(() => {
    if (hasLoadedAidRequest) {
      localStorage.setItem("remarkForAllData", remarkForAll);
      console.log("Saved remarkForAllData to localStorage:", remarkForAll);
    }
  }, [remarkForAll, hasLoadedAidRequest]);

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
      setSelectedItems({});
      setEnableCustomItem(false);
      setCustomItem({
        description: "",
        quantity: 1,
        md_approval_required_or_not: "No",
        md_approval_obtained: "No",
        md_approval_details: "",
      });
      setRemarkForAll("");
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

    // Evaluate if current description is Auditorium, Classroom, or Misc
    const isAuditoriumOrMisc =
      currentItem.description.toLowerCase().trim() === "auditorium" ||
      currentItem.description.toLowerCase().trim() === "classroom" ||
      currentItem.item_no === "14";

    const mdFields = [
      "md_approval_required_or_not",
      "md_approval_obtained",
      "md_approval_details",
    ];

    if (
      !(isAuditoriumOrMisc && aidRequest.paid_course_or_not === "Yes") &&
      mdFields.includes(name)
    ) {
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
      setErrorMessage(validationErrors.join(" "));
      return;
    }

    // (Optional safety net)
    if (!validateStep()) {
      setErrorMessage("Please complete all required fields before submitting.");
      return;
    }

    // Build aidItems from selectedItems and customItem
    const builtAidItems = [];
    Object.entries(selectedItems).forEach(([itemNo, itemData]) => {
      if (itemData.selected) {
        builtAidItems.push({
          item_no: itemNo,
          description:
            itemDescriptionMapping[itemNo] || itemData.description || "",
          quantity: itemData.quantity || 1,
          remark: remarkForAll,
          md_approval_required_or_not:
            itemData.md_approval_required_or_not || "No",
          md_approval_obtained: itemData.md_approval_obtained || "No",
          md_approval_details: itemData.md_approval_details || "",
          CTM_approval_obtained: itemData.CTM_approval_obtained || "-",
          CTM_Details: itemData.CTM_Details || "-",
        });
      }
    });

    // Add custom item if enabled and provided
    if (enableCustomItem && customItem.description.trim()) {
      builtAidItems.push({
        item_no: "14", // Miscellaneous
        description: `${customItem.description.trim()} (miscellaneous)`,
        quantity: customItem.quantity || 1,
        remark: remarkForAll,
        md_approval_required_or_not:
          customItem.md_approval_required_or_not || "No",
        md_approval_obtained: customItem.md_approval_obtained || "No",
        md_approval_details: customItem.md_approval_details || "",
        CTM_approval_obtained: "-",
        CTM_Details: "-",
      });
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
        builtAidItems
      );
      const response = await authRequest("post", getApiUrl("/aidrequests"), {
        aidRequest: updatedAidRequest, // Pass the updated aidRequest
        aidItems: builtAidItems,
      });

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
      setSelectedItems({});
      setEnableCustomItem(false);
      setCustomItem({
        description: "",
        quantity: 1,
        md_approval_required_or_not: "No",
        md_approval_obtained: "No",
        md_approval_details: "",
      });
      setRemarkForAll("");
      localStorage.removeItem("aidRequestData");
      localStorage.removeItem("aidItemsData");
      localStorage.removeItem("selectedItemsData");
      localStorage.removeItem("customItemData");
      localStorage.removeItem("remarkForAllData");
      setCurrentStep(1);
      console.log("Cleared all data from localStorage");
    } catch (err) {
      console.error("Error creating aid request:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to submit aid request. Please try again."
      );
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
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const SuccessPopup = ({ message }) => {
    const popupRef = useRef(null);

    useEffect(() => {
      if (popupRef.current) {
        // Focus the popup to draw user attention
        popupRef.current.focus();
        // Scroll to ensure it's visible
        popupRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, []);

    return (
      <div
        ref={popupRef}
        tabIndex={-1}
        className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-6 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-500 border border-white/20 backdrop-blur-xl max-w-md focus:outline-none focus:ring-4 focus:ring-emerald-300"
        style={{
          animation:
            "slideInFromRight 0.5s ease-out, pulse 0.8s ease-in-out 0.3s",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-lg leading-tight">{message}</p>
            <p className="text-emerald-100 text-sm mt-1">
              Your request has been submitted successfully!
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ErrorPopup = ({ message }) => {
    const popupRef = useRef(null);

    useEffect(() => {
      if (popupRef.current) {
        // Focus the popup to draw user attention
        popupRef.current.focus();
        // Scroll to ensure it's visible
        popupRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, []);

    return (
      <div
        ref={popupRef}
        tabIndex={-1}
        className="fixed top-6 right-6 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-8 py-6 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-500 border border-white/20 backdrop-blur-xl max-w-md focus:outline-none focus:ring-4 focus:ring-red-300"
        style={{
          animation:
            "slideInFromRight 0.5s ease-out, shake 0.6s ease-in-out 0.3s",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-lg leading-tight">Error</p>
            <p className="text-red-100 text-sm mt-1">{message}</p>
          </div>
        </div>
      </div>
    );
  };

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
        // Step 4 is now optional - no items required
        const hasSelectedItems = Object.values(selectedItems).some(
          (item) => item.selected
        );
        const hasCustomItem = customItem.description.trim();

        // If no items selected, step is valid
        if (!hasSelectedItems && !hasCustomItem) {
          return true;
        }

        // Validate selected predefined items
        const selectedItemsValid = Object.entries(selectedItems).every(
          ([itemNo, itemData]) => {
            if (!itemData.selected) return true; // Skip unselected items

            const isAuditoriumOrMisc =
              itemDescriptionMapping[itemNo]?.toLowerCase() === "auditorium" ||
              itemNo === "14";

            const isCTMRequired =
              aidRequest.paid_course_or_not === "Yes" && itemNo === "03";

            const baseValid = itemData.quantity > 0;

            const mdValid =
              isAuditoriumOrMisc && aidRequest.paid_course_or_not === "Yes"
                ? (itemData.md_approval_required_or_not || "No").trim() &&
                  (itemData.md_approval_obtained || "No").trim()
                : true;

            const ctmValid = isCTMRequired
              ? (itemData.CTM_approval_obtained || "-").trim() &&
                (itemData.CTM_Details || "-").trim()
              : true;

            return baseValid && mdValid && ctmValid;
          }
        );

        // Validate custom item
        const customItemValid =
          !hasCustomItem ||
          (customItem.quantity > 0 &&
            (aidRequest.paid_course_or_not !== "Yes" ||
              (customItem.md_approval_required_or_not.trim() &&
                customItem.md_approval_obtained.trim())));

        return selectedItemsValid && customItemValid;
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

        const step4Valid = (() => {
          // Step 4 is now optional - no items required
          const hasSelectedItems = Object.values(selectedItems).some(
            (item) => item.selected
          );
          const hasCustomItem =
            enableCustomItem && customItem.description.trim();

          // If no items selected, step is valid
          if (!hasSelectedItems && !hasCustomItem) {
            return true;
          }

          // Validate selected predefined items
          const selectedItemsValid = Object.entries(selectedItems).every(
            ([itemNo, itemData]) => {
              if (!itemData.selected) return true; // Skip unselected items

              const isAuditoriumOrMisc =
                itemDescriptionMapping[itemNo]?.toLowerCase() ===
                  "auditorium" || itemNo === "14";

              const isCTMRequired =
                aidRequest.paid_course_or_not === "Yes" && itemNo === "03";

              const baseValid = itemData.quantity > 0;

              const mdValid =
                isAuditoriumOrMisc && aidRequest.paid_course_or_not === "Yes"
                  ? (itemData.md_approval_required_or_not || "No").trim() &&
                    (itemData.md_approval_obtained || "No").trim()
                  : true;

              const ctmValid = isCTMRequired
                ? (itemData.CTM_approval_obtained || "-").trim() &&
                  (itemData.CTM_Details || "-").trim()
                : true;

              return baseValid && mdValid && ctmValid;
            }
          );

          // Validate custom item
          const customItemValid =
            !hasCustomItem ||
            (customItem.quantity > 0 &&
              (aidRequest.paid_course_or_not !== "Yes" ||
                (customItem.md_approval_required_or_not.trim() &&
                  customItem.md_approval_obtained.trim())));

          return selectedItemsValid && customItemValid;
        })();

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
          className:
            "border-2 border-slate-200 focus:border-blue-500 rounded-lg",
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
        if (!(isAuditoriumOrMisc && aidRequest.paid_course_or_not === "Yes"))
          return null;
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
        if (!(isAuditoriumOrMisc && aidRequest.paid_course_or_not === "Yes"))
          return null;
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
        if (!(isAuditoriumOrMisc && aidRequest.paid_course_or_not === "Yes"))
          return null;
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
              <p className="text-slate-600 mt-2">
                Please provide the basic information about the requesting
                officer and course
              </p>
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
              <p className="text-slate-600 mt-2">
                Provide participant details and schedule information
              </p>
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
              <p className="text-slate-600 mt-2">
                Set your preferences and complete the sign-off process
              </p>
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
                Step 4: Select Aid Items
              </h2>
              <p className="text-slate-600 mt-2">
                Select the required aid items from the list below and specify
                quantities
              </p>
            </div>

            {/* Remarks field for all items */}
            <Card className="border border-slate-200 shadow-sm mb-6">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Remarks (applies to all selected items)
                  </label>
                  <Input
                    type="text"
                    value={remarkForAll}
                    onChange={(e) => setRemarkForAll(e.target.value)}
                    placeholder="Enter remarks for all selected items..."
                    className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Predefined items list */}
            <Card className="border border-slate-200 shadow-sm mb-6">
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Predefined Aid Items
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(itemDescriptionMapping)
                    .filter(([key]) => key !== "14")
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([itemNo, description]) => {
                      const isSelected =
                        selectedItems[itemNo]?.selected || false;
                      const quantity = selectedItems[itemNo]?.quantity || 1;
                      const isAuditoriumOrMisc =
                        description.toLowerCase() === "auditorium" ||
                        description.toLowerCase() === "classroom" ||
                        itemNo === "14";
                      const isCTMRequired =
                        aidRequest.paid_course_or_not === "Yes" &&
                        itemNo === "03";

                      return (
                        <div
                          key={itemNo}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  [itemNo]: {
                                    ...prev[itemNo],
                                    selected: e.target.checked,
                                    quantity: prev[itemNo]?.quantity || 1,
                                    md_approval_required_or_not:
                                      prev[itemNo]
                                        ?.md_approval_required_or_not || "No",
                                    md_approval_obtained:
                                      prev[itemNo]?.md_approval_obtained ||
                                      "No",
                                    md_approval_details:
                                      prev[itemNo]?.md_approval_details || "",
                                    CTM_approval_obtained:
                                      prev[itemNo]?.CTM_approval_obtained ||
                                      "-",
                                    CTM_Details:
                                      prev[itemNo]?.CTM_Details || "-",
                                  },
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {itemNo}: {description}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="ml-7 space-y-3">
                              {/* Quantity input */}
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-slate-600 w-20">
                                  Quantity:
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={quantity}
                                  onChange={(e) => {
                                    setSelectedItems((prev) => ({
                                      ...prev,
                                      [itemNo]: {
                                        ...prev[itemNo],
                                        quantity: parseInt(e.target.value) || 1,
                                      },
                                    }));
                                  }}
                                  className="w-20 border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                                />
                              </div>

                              {/* Conditional MD fields for Auditorium/Misc */}
                              {isAuditoriumOrMisc &&
                                aidRequest.paid_course_or_not === "Yes" && (
                                  <div className="space-y-3 border-t border-slate-200 pt-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-600">
                                          MD Approval Required:
                                        </label>
                                        <Select
                                          value={{
                                            value:
                                              selectedItems[itemNo]
                                                ?.md_approval_required_or_not ||
                                              "No",
                                            label:
                                              selectedItems[itemNo]
                                                ?.md_approval_required_or_not ||
                                              "No",
                                          }}
                                          onChange={(selected) => {
                                            setSelectedItems((prev) => ({
                                              ...prev,
                                              [itemNo]: {
                                                ...prev[itemNo],
                                                md_approval_required_or_not:
                                                  selected.value,
                                              },
                                            }));
                                          }}
                                          options={[
                                            { value: "Yes", label: "Yes" },
                                            { value: "No", label: "No" },
                                          ]}
                                          styles={customSelectStyles}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-600">
                                          MD Approval Obtained:
                                        </label>
                                        <Select
                                          value={{
                                            value:
                                              selectedItems[itemNo]
                                                ?.md_approval_obtained || "No",
                                            label:
                                              selectedItems[itemNo]
                                                ?.md_approval_obtained || "No",
                                          }}
                                          onChange={(selected) => {
                                            setSelectedItems((prev) => ({
                                              ...prev,
                                              [itemNo]: {
                                                ...prev[itemNo],
                                                md_approval_obtained:
                                                  selected.value,
                                              },
                                            }));
                                          }}
                                          options={[
                                            { value: "Yes", label: "Yes" },
                                            { value: "No", label: "No" },
                                          ]}
                                          styles={customSelectStyles}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-600">
                                        MD Approval Details:
                                      </label>
                                      <Input
                                        type="text"
                                        value={
                                          selectedItems[itemNo]
                                            ?.md_approval_details || ""
                                        }
                                        onChange={(e) => {
                                          setSelectedItems((prev) => ({
                                            ...prev,
                                            [itemNo]: {
                                              ...prev[itemNo],
                                              md_approval_details:
                                                e.target.value,
                                            },
                                          }));
                                        }}
                                        placeholder="Enter approval details..."
                                        className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                                      />
                                    </div>
                                  </div>
                                )}

                              {/* Conditional CTM fields for Classroom if paid */}
                              {isCTMRequired && (
                                <div className="space-y-3 border-t border-slate-200 pt-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-600">
                                        CTM Approval Obtained:
                                      </label>
                                      <Select
                                        value={{
                                          value:
                                            selectedItems[itemNo]
                                              ?.CTM_approval_obtained || "-",
                                          label:
                                            selectedItems[itemNo]
                                              ?.CTM_approval_obtained || "-",
                                        }}
                                        onChange={(selected) => {
                                          setSelectedItems((prev) => ({
                                            ...prev,
                                            [itemNo]: {
                                              ...prev[itemNo],
                                              CTM_approval_obtained:
                                                selected.value,
                                            },
                                          }));
                                        }}
                                        options={[
                                          { value: "Yes", label: "Yes" },
                                          { value: "No", label: "No" },
                                          { value: "-", label: "-" },
                                        ]}
                                        styles={customSelectStyles}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-600">
                                        CTM Details:
                                      </label>
                                      <Input
                                        type="text"
                                        value={
                                          selectedItems[itemNo]?.CTM_Details ||
                                          ""
                                        }
                                        onChange={(e) => {
                                          setSelectedItems((prev) => ({
                                            ...prev,
                                            [itemNo]: {
                                              ...prev[itemNo],
                                              CTM_Details: e.target.value,
                                            },
                                          }));
                                        }}
                                        placeholder="Enter CTM details..."
                                        className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Custom item section */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Custom/Miscellaneous Item
                </h3>
                <p className="text-sm text-slate-600">
                  Add any item not listed above
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={enableCustomItem}
                      onChange={(e) => setEnableCustomItem(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-slate-700">
                      Add Custom Item
                    </label>
                  </div>

                  {enableCustomItem && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                          Item Description:
                        </label>
                        <Input
                          type="text"
                          value={customItem.description}
                          onChange={(e) =>
                            setCustomItem((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Enter custom item description..."
                          className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                          Quantity:
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={customItem.quantity}
                          onChange={(e) =>
                            setCustomItem((prev) => ({
                              ...prev,
                              quantity: parseInt(e.target.value) || 1,
                            }))
                          }
                          className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                        />
                      </div>

                      {/* Conditional MD fields for Custom Item if paid course */}
                      {aidRequest.paid_course_or_not === "Yes" && (
                        <div className="space-y-3 border-t border-slate-200 pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-600">
                                MD Approval Required:
                              </label>
                              <Select
                                value={{
                                  value: customItem.md_approval_required_or_not,
                                  label: customItem.md_approval_required_or_not,
                                }}
                                onChange={(selected) => {
                                  setCustomItem((prev) => ({
                                    ...prev,
                                    md_approval_required_or_not: selected.value,
                                  }));
                                }}
                                options={[
                                  { value: "Yes", label: "Yes" },
                                  { value: "No", label: "No" },
                                ]}
                                styles={customSelectStyles}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-600">
                                MD Approval Obtained:
                              </label>
                              <Select
                                value={{
                                  value: customItem.md_approval_obtained,
                                  label: customItem.md_approval_obtained,
                                }}
                                onChange={(selected) => {
                                  setCustomItem((prev) => ({
                                    ...prev,
                                    md_approval_obtained: selected.value,
                                  }));
                                }}
                                options={[
                                  { value: "Yes", label: "Yes" },
                                  { value: "No", label: "No" },
                                ]}
                                styles={customSelectStyles}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                              MD Approval Details:
                            </label>
                            <Input
                              type="text"
                              value={customItem.md_approval_details}
                              onChange={(e) => {
                                setCustomItem((prev) => ({
                                  ...prev,
                                  md_approval_details: e.target.value,
                                }));
                              }}
                              placeholder="Enter approval details..."
                              className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        );
      case 5:
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-3">
                <CheckCircle className="w-7 h-7 text-blue-600" />
                Step 5: Review & Submit Your Request
              </h2>
              <p className="text-slate-700 mt-3 font-medium">
                Please carefully review all information before submitting your
                request
              </p>
            </div>
            <div className="space-y-8">
              <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 py-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-4 px-6 min-h-[60px] flex items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2 m-0">
                    <FileText className="w-5 h-5" />
                    Request Details
                  </h3>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(aidRequest).map(([key, val]) =>
                      key !== "request_status" &&
                      key !== "payment_status" &&
                      key !== "cancelled_by_requester" ? (
                        <div
                          key={key}
                          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"
                        >
                          <span className="text-sm font-semibold text-slate-800 capitalize block mb-2">
                            {key === "classrooms_allocated"
                              ? "Classroom(s) Requested"
                              : key.replaceAll("_", " ")}
                          </span>
                          <span className="text-sm text-slate-900 font-medium leading-relaxed">
                            {val === null ||
                            val === undefined ||
                            val === "" ||
                            (Array.isArray(val) && val.length === 0)
                              ? "Not specified"
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
              {(() => {
                const hasSelectedItems = Object.values(selectedItems).some(
                  (item) => item.selected
                );
                const hasCustomItem =
                  enableCustomItem && customItem.description.trim();
                return (
                  (hasSelectedItems || hasCustomItem) && (
                    <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 py-0">
                      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg py-4 px-6 min-h-[60px] flex items-center">
                        <h3 className="text-lg font-semibold flex items-center gap-2 m-0">
                          <Package className="w-5 h-5" />
                          Aid Items Requested
                        </h3>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {Object.entries(selectedItems).map(
                            ([itemNo, itemData], index) => {
                              if (!itemData.selected) return null;

                              const item = {
                                item_no: itemNo,
                                description:
                                  itemDescriptionMapping[itemNo] || "",
                                quantity: itemData.quantity || 1,
                                remark: remarkForAll,
                                md_approval_required_or_not:
                                  itemData.md_approval_required_or_not || "No",
                                md_approval_obtained:
                                  itemData.md_approval_obtained || "No",
                                md_approval_details:
                                  itemData.md_approval_details || "",
                                CTM_approval_obtained:
                                  itemData.CTM_approval_obtained || "-",
                                CTM_Details: itemData.CTM_Details || "-",
                              };

                              return (
                                <div
                                  key={itemNo}
                                  className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-md"
                                >
                                  <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                      {index + 1}
                                    </span>
                                    Item {index + 1}
                                  </h4>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {Object.entries(item).map(([key, val]) => {
                                      const shouldShowCTMFields =
                                        aidRequest.paid_course_or_not ===
                                          "Yes" && item.item_no === "03";

                                      const isAuditoriumOrMisc =
                                        item.description
                                          .toLowerCase()
                                          .trim() === "auditorium" ||
                                        item.item_no === "14";

                                      // Skip CTM fields if condition not met
                                      if (
                                        (key === "CTM_approval_obtained" ||
                                          key === "CTM_Details") &&
                                        !shouldShowCTMFields
                                      ) {
                                        return null;
                                      }

                                      if (
                                        (key ===
                                          "md_approval_required_or_not" ||
                                          key === "md_approval_obtained" ||
                                          key === "md_approval_details") &&
                                        !(
                                          isAuditoriumOrMisc &&
                                          aidRequest.paid_course_or_not ===
                                            "Yes"
                                        )
                                      ) {
                                        return null;
                                      }
                                      const displayValue =
                                        (key === "md_approval_details" ||
                                          key === "CTM_Details") &&
                                        (!val || !val.trim())
                                          ? "Not specified"
                                          : val;

                                      return (
                                        <div
                                          key={key}
                                          className="bg-slate-50 p-3 rounded-lg border border-slate-200"
                                        >
                                          <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                            {key.replaceAll("_", " ")}
                                          </span>
                                          <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                            {displayValue}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          )}
                          {hasCustomItem && (
                            <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-md">
                              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                  {Object.values(selectedItems).filter(
                                    (item) => item.selected
                                  ).length + 1}
                                </span>
                                Custom Item
                              </h4>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                    Item No
                                  </span>
                                  <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                    14
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                    Description
                                  </span>
                                  <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                    {customItem.description} (miscellaneous)
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                    Quantity
                                  </span>
                                  <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                    {customItem.quantity}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                    Remark
                                  </span>
                                  <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                    {remarkForAll || "Not specified"}
                                  </span>
                                </div>
                                {aidRequest.paid_course_or_not === "Yes" && (
                                  <>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                      <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                        MD Approval Required
                                      </span>
                                      <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                        {customItem.md_approval_required_or_not ||
                                          "No"}
                                      </span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                      <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                        MD Approval Obtained
                                      </span>
                                      <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                        {customItem.md_approval_obtained ||
                                          "No"}
                                      </span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                      <span className="text-sm font-semibold text-slate-800 capitalize block mb-1">
                                        MD Approval Details
                                      </span>
                                      <span className="text-sm text-slate-900 font-medium leading-relaxed">
                                        {customItem.md_approval_details ||
                                          "Not specified"}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                );
              })()}
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
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>
      {successMessage && <SuccessPopup message={successMessage} />}
      {errorMessage && <ErrorPopup message={errorMessage} />}

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
                            {isCompleted ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              stepNum
                            )}
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
                    onClick={() =>
                      clearAndRefresh([
                        "aidRequestData",
                        "aidItemsData",
                        "selectedItemsData",
                        "enableCustomItemData",
                        "customItemData",
                        "remarkForAllData",
                      ])
                    }
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

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { authRequest } from "../../services/authService";
// import { getApiUrl } from "../../utils/apiUrl";
// import "./styles/aidHandover.css";
// import Select from "react-select";
// import CreatableSelect from "react-select/creatable";
// import {
//   itemDescriptionMapping,
//   groupedCourseOptions,
//   dayOptions,
//   generateTimeOptions,
//   classroomOptions,
// } from "./aidUtils";

// const AidRequestForm = () => {
//   const [aidRequest, setAidRequest] = useState({
//     requesting_officer_name: "",
//     designation: "",
//     requesting_officer_email: "",
//     course_name: "",
//     duration: "",
//     audience_type: "",
//     no_of_participants: 0,
//     course_coordinator: "",
//     date_from: "",
//     date_to: "",
//     time_from: "",
//     time_to: "",
//     preferred_days_of_week: [],
//     paid_course_or_not: "No",
//     payment_status: "Not Set",
//     signed_date: "",
//     request_status: "pending",
//     classrooms_allocated: [],
//     exam_or_not: "No",
//     cancelled_by_requester: "No",
//   });
//   const [aidItems, setAidItems] = useState([]);
//   const [successMessage, setSuccessMessage] = useState("");

//   const today = new Date().toISOString().split("T")[0];
//   const timeOptions = generateTimeOptions();

//   const [hasLoadedAidRequest, setHasLoadedAidRequest] = useState(false);

//   const [currentStep, setCurrentStep] = useState(1);
//   const totalSteps = 5;
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [remarkForAll, setRemarkForAll] = useState("");
//   const [validDayOptions, setValidDayOptions] = useState(dayOptions);

//   const navigate = useNavigate();

//   const addAidItem = () => {
//     setAidItems((prev) => [
//       ...prev,
//       {
//         item_no: "01",
//         description: itemDescriptionMapping["01"],
//         quantity: "1",
//         remark: remarkForAll,
//         md_approval_required_or_not: "No",
//         md_approval_obtained: "No",
//         md_approval_details: "",
//         CTM_approval_obtained: "-",
//         CTM_Details: "-",
//       },
//     ]);
//   };

//   useEffect(() => {
//     if (!aidRequest.date_from || !aidRequest.date_to) {
//       setValidDayOptions(dayOptions); // Show all days by default
//       return;
//     }

//     const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//     const dateFrom = new Date(aidRequest.date_from);
//     const dateTo = new Date(aidRequest.date_to);

//     const validDays = new Set();
//     let current = new Date(dateFrom);

//     while (current <= dateTo) {
//       validDays.add(shortDayNames[current.getDay()]);
//       current.setDate(current.getDate() + 1);
//     }

//     const filteredOptions = dayOptions.filter((opt) =>
//       validDays.has(opt.value)
//     );
//     setValidDayOptions(filteredOptions);

//     // Auto-remove previously selected invalid days
//     setAidRequest((prev) => ({
//       ...prev,
//       preferred_days_of_week: prev.preferred_days_of_week.filter((d) =>
//         validDays.has(d)
//       ),
//     }));
//   }, [aidRequest.date_from, aidRequest.date_to]);

//   useEffect(() => {
//     const savedAidRequest = localStorage.getItem("aidRequestData");
//     const savedAidItems = localStorage.getItem("aidItemsData");

//     if (savedAidRequest) {
//       try {
//         const parsedRequest = JSON.parse(savedAidRequest);
//         setAidRequest((prev) => ({
//           ...prev,
//           ...parsedRequest,
//           classrooms_allocated: Array.isArray(
//             parsedRequest.classrooms_allocated
//           )
//             ? parsedRequest.classrooms_allocated
//             : [],
//           exam_or_not: parsedRequest.exam_or_not || "No",
//         }));
//         console.log(
//           "Restored aidRequestData from localStorage:",
//           parsedRequest
//         );
//       } catch (e) {
//         console.error("Failed to parse aidRequestData:", e);
//       }
//     }

//     if (savedAidItems) {
//       try {
//         const parsedItems = JSON.parse(savedAidItems);

//         const sanitizedItems = parsedItems.map((item) => ({
//           ...item,
//           md_approval_required_or_not: item.md_approval_required_or_not || "No",
//           md_approval_obtained: item.md_approval_obtained || "No",
//           md_approval_details: item.md_approval_details || "",
//           CTM_approval_obtained: item.CTM_approval_obtained || "-",
//           CTM_Details: item.CTM_Details || "-",
//         }));

//         setAidItems(sanitizedItems);
//         console.log("Restored aidItemsData from localStorage:", sanitizedItems);
//       } catch (e) {
//         console.error("Failed to parse aidItemsData:", e);
//       }
//     }

//     setHasLoadedAidRequest(true);
//   }, []);

//   useEffect(() => {
//     if (hasLoadedAidRequest) {
//       localStorage.setItem("aidRequestData", JSON.stringify(aidRequest));
//       console.log("Saved aidRequestData to localStorage:", aidRequest);
//     }
//   }, [aidRequest, hasLoadedAidRequest]);

//   useEffect(() => {
//     if (hasLoadedAidRequest) {
//       localStorage.setItem("aidItemsData", JSON.stringify(aidItems));
//       console.log("Saved aidItemsData to localStorage:", aidItems);
//     }
//   }, [aidItems, hasLoadedAidRequest]);

//   const clearAndRefresh = (keys) => {
//     if (window.confirm("Are you sure you want to clear saved form data?")) {
//       keys.forEach((key) => localStorage.removeItem(key));
//       console.log("Cleared localStorage keys:", keys);

//       setAidRequest({
//         requesting_officer_name: "",
//         designation: "",
//         requesting_officer_email: "",
//         course_name: "",
//         duration: "",
//         audience_type: "",
//         no_of_participants: 0,
//         course_coordinator: "",
//         date_from: "",
//         date_to: "",
//         time_from: "",
//         time_to: "",
//         preferred_days_of_week: [],
//         paid_course_or_not: "No",
//         payment_status: "Not Set",
//         signed_date: "",
//         request_status: "pending",
//         classrooms_allocated: [],
//         exam_or_not: "No",
//         cancelled_by_requester: "No",
//       });
//       setAidItems([]);
//       setCurrentStep(1);
//     }
//   };

//   const handleAidRequestChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "preferred_days_of_week") {
//       const options = e.target.selectedOptions;
//       const values = Array.from(options, (opt) => opt.value);
//       setAidRequest((prev) => ({ ...prev, [name]: values }));
//       return;
//     }

//     setAidRequest((prev) => {
//       const updated = { ...prev, [name]: value };
//       const isDate =
//         name === "date_from" || name === "date_to" || name === "signed_date";
//       const todayDate = new Date();
//       todayDate.setHours(0, 0, 0, 0);

//       // If changing from Yes to No, reset CTM fields in aidItems
//       if (name === "paid_course_or_not" && value === "No") {
//         setAidItems((prevItems) =>
//           prevItems.map((item) => {
//             if (item.item_no === "03") {
//               return {
//                 ...item,
//                 CTM_approval_obtained: "-",
//                 CTM_Details: "-",
//               };
//             }
//             return item;
//           })
//         );
//       }

//       // Prevent past dates
//       if (isDate && new Date(value) < todayDate) {
//         alert("You cannot select a past date.");
//         return prev;
//       }

//       // Validate date range
//       if (
//         name === "date_from" &&
//         updated.date_to &&
//         new Date(value) > new Date(updated.date_to)
//       ) {
//         alert("Start date cannot be after end date.");
//         return prev;
//       }

//       if (
//         name === "date_to" &&
//         updated.date_from &&
//         new Date(updated.date_from) > new Date(value)
//       ) {
//         alert("End date cannot be before start date.");
//         return prev;
//       }

//       // Always validate time range if both are present
//       if (
//         (name === "time_from" ||
//           name === "time_to" ||
//           updated.time_from ||
//           updated.time_to) &&
//         updated.time_from &&
//         updated.time_to
//       ) {
//         const [h1, m1] = updated.time_from.split(":").map(Number);
//         const [h2, m2] = updated.time_to.split(":").map(Number);
//         const t1 = h1 * 60 + m1;
//         const t2 = h2 * 60 + m2;

//         if (t1 >= t2) {
//           alert("Start time must be before end time.");
//           return prev;
//         }
//       }

//       return updated;
//     });
//   };

//   const getClassName = (defaultClass = "form-step") => {
//     return currentStep === 3 ? `${defaultClass} half-width` : defaultClass;
//   };

//   const handlePreferredDaysChange = (selectedOptions) => {
//     const selectedValues = selectedOptions.map((opt) => opt.value);
//     setAidRequest((prev) => ({
//       ...prev,
//       preferred_days_of_week: selectedValues,
//     }));
//   };

//   const handleAidItemChange = (index, e) => {
//     const { name, value } = e.target;

//     // If the field is 'remark', set it for all items
//     if (name === "remark") {
//       setRemarkForAll(value);
//       const newItems = aidItems.map((item) => ({
//         ...item,
//         remark: value,
//       }));
//       setAidItems(newItems);
//       return;
//     }

//     const updatedItems = [...aidItems];
//     const currentItem = { ...updatedItems[index] };

//     // If item_no is changed, reset MD fields and update description
//     if (name === "item_no") {
//       // Reset MD fields unconditionally
//       currentItem.md_approval_required_or_not = "No";
//       currentItem.md_approval_obtained = "No";
//       currentItem.md_approval_details = "";

//       currentItem.CTM_approval_obtained = "-";
//       currentItem.CTM_Details = "-";

//       currentItem.item_no = value;

//       // Update description
//       if (value === "14") {
//         currentItem.description = "";
//       } else {
//         currentItem.description = itemDescriptionMapping[value] || "";
//       }

//       updatedItems[index] = currentItem;
//       setAidItems(updatedItems);
//       return; // Exit early since all logic for item_no is done
//     }

//     // Evaluate if current description is Auditorium
//     const isAuditoriumOrMisc =
//       currentItem.description.toLowerCase().trim() === "auditorium" ||
//       currentItem.item_no === "14";

//     const mdFields = [
//       "md_approval_required_or_not",
//       "md_approval_obtained",
//       "md_approval_details",
//     ];

//     if (!isAuditoriumOrMisc && mdFields.includes(name)) {
//       return;
//     }

//     const shouldAllowCTMFields =
//       aidRequest.paid_course_or_not === "Yes" && currentItem.item_no === "03";

//     const ctmFields = ["CTM_approval_obtained", "CTM_Details"];
//     if (!shouldAllowCTMFields && ctmFields.includes(name)) {
//       return;
//     }

//     currentItem[name] = value;

//     updatedItems[index] = currentItem;
//     setAidItems(updatedItems);
//   };

//   const handleAidItemBlur = (index, e) => {
//     const { value } = e.target;
//     const updatedItems = [...aidItems];
//     if (
//       updatedItems[index].item_no === "14" &&
//       value &&
//       !value.includes("(miscellaneous)")
//     ) {
//       updatedItems[index].description = `${value.trim()} (miscellaneous)`;
//       setAidItems(updatedItems);
//     }
//   };

//   const removeAidItem = (index) => {
//     setAidItems((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const validationErrors = validateAidRequest(aidRequest);
//     if (validationErrors.length > 0) {
//       alert(validationErrors.join("\n"));
//       return;
//     }

//     // (Optional safety net)
//     if (!validateStep()) {
//       alert("Please complete all required fields before submitting.");
//       return;
//     }

//     // Convert preferred_days_of_week array to a comma-separated string
//     const updatedAidRequest = {
//       ...aidRequest,
//       preferred_days_of_week: aidRequest.preferred_days_of_week.join(","),
//       classrooms_allocated: aidRequest.classrooms_allocated.join(","),
//       payment_status:
//         aidRequest.paid_course_or_not === "Yes" ? "pending" : "Not Set",
//     };

//     setIsSubmitting(true);
//     try {
//       console.log(
//         "Submitting aid request payload:",
//         updatedAidRequest,
//         aidItems
//       );
//       const response = await authRequest(
//         "post",
//         getApiUrl("/aidrequests"),
//         {
//           aidRequest: updatedAidRequest, // Pass the updated aidRequest
//           aidItems,
//         }
//       );

//       setSuccessMessage(
//         `Aid Request created successfully! Your Request Id is: ${response.request_id}`
//       );

//       console.log("Response:", response.data);

//       // Reset form fields after submission
//       setAidRequest({
//         requesting_officer_name: "",
//         designation: "",
//         requesting_officer_email: "",
//         course_name: "",
//         duration: "",
//         audience_type: "",
//         no_of_participants: 0,
//         course_coordinator: "",
//         date_from: "",
//         date_to: "",
//         time_from: "",
//         time_to: "",
//         preferred_days_of_week: [],
//         paid_course_or_not: "No",
//         payment_status: "Not Set",
//         signed_date: "",
//         request_status: "pending",
//         classrooms_allocated: [],
//         exam_or_not: "No",
//         cancelled_by_requester: "No",
//       });
//       setAidItems([]);
//       localStorage.removeItem("aidRequestData");
//       localStorage.removeItem("aidItemsData");
//       setCurrentStep(1);
//       console.log("Cleared aidRequestData and aidItemsData from localStorage");
//     } catch (err) {
//       console.error("Error creating aid request:", err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const validateAidRequest = (aidRequest) => {
//     const errors = [];

//     // Validate required dates
//     const dateFrom = new Date(aidRequest.date_from);
//     const dateTo = new Date(aidRequest.date_to);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (!aidRequest.date_from || !aidRequest.date_to) {
//       errors.push("Both start and end dates are required.");
//     } else {
//       if (dateFrom < today || dateTo < today) {
//         errors.push("Dates cannot be in the past.");
//       }
//       if (dateFrom > dateTo) {
//         errors.push("Start date cannot be after end date.");
//       }
//     }

//     // Validate required times
//     if (!aidRequest.time_from || !aidRequest.time_to) {
//       errors.push("Both start and end times are required.");
//     } else {
//       const [h1, m1] = aidRequest.time_from.split(":").map(Number);
//       const [h2, m2] = aidRequest.time_to.split(":").map(Number);
//       const t1 = h1 * 60 + m1;
//       const t2 = h2 * 60 + m2;

//       if (t1 >= t2) {
//         errors.push("Start time must be before end time.");
//       }
//     }
//     return errors;
//   };

//   useEffect(() => {
//     if (successMessage) {
//       const timer = setTimeout(() => setSuccessMessage(""), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [successMessage]);

//   const SuccessPopup = ({ message }) => (
//     <div className="success-popup">
//       <svg
//         className="icon"
//         xmlns="https://www.w3.org/2000/svg"
//         viewBox="0 0 20 20"
//       >
//         <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
//       </svg>
//       <p className="font-bold">{message}</p>
//     </div>
//   );

//   const validateStep = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           aidRequest.requesting_officer_name.trim() &&
//           aidRequest.designation.trim() &&
//           aidRequest.requesting_officer_email.trim() &&
//           aidRequest.course_name.trim() &&
//           aidRequest.duration.trim() &&
//           aidRequest.audience_type.trim()
//         );
//       case 2:
//         return (
//           aidRequest.no_of_participants > 0 &&
//           aidRequest.course_coordinator.trim() &&
//           aidRequest.date_from &&
//           aidRequest.date_to &&
//           aidRequest.time_from &&
//           aidRequest.time_to
//         );
//       case 3:
//         return (
//           aidRequest.preferred_days_of_week.length > 0 &&
//           aidRequest.paid_course_or_not &&
//           aidRequest.signed_date &&
//           aidRequest.exam_or_not
//         );
//       case 4:
//         return (
//           aidItems.length > 0 &&
//           aidItems.every((item) => {
//             const isAuditoriumOrMisc =
//               item.description.toLowerCase() === "auditorium" ||
//               item.item_no === "14";

//             const isCTMRequired =
//               aidRequest.paid_course_or_not === "Yes" && item.item_no === "03";

//             const baseValid =
//               item.item_no &&
//               item.description.trim() &&
//               item.quantity > 0 &&
//               item.remark.trim();

//             const mdValid = isAuditoriumOrMisc
//               ? item.md_approval_required_or_not.trim() &&
//                 item.md_approval_obtained.trim()
//               : true;

//             const ctmValid = isCTMRequired
//               ? item.CTM_approval_obtained?.trim() && item.CTM_Details?.trim()
//               : true;

//             return baseValid && mdValid && ctmValid;
//           })
//         );
//       case 5:
//         // Just check that all steps are valid using *local conditions* (don't call validateStep again)
//         const step1Valid =
//           aidRequest.requesting_officer_name.trim() &&
//           aidRequest.designation.trim() &&
//           aidRequest.requesting_officer_email.trim() &&
//           aidRequest.course_name.trim() &&
//           aidRequest.duration.trim() &&
//           aidRequest.audience_type.trim();

//         const step2Valid =
//           aidRequest.no_of_participants > 0 &&
//           aidRequest.course_coordinator.trim() &&
//           aidRequest.date_from &&
//           aidRequest.date_to &&
//           aidRequest.time_from &&
//           aidRequest.time_to;

//         const step3Valid =
//           aidRequest.preferred_days_of_week.length > 0 &&
//           aidRequest.paid_course_or_not &&
//           aidRequest.signed_date &&
//           aidRequest.exam_or_not;

//         const step4Valid =
//           aidItems.length > 0 &&
//           aidItems.every((item) => {
//             const isAuditoriumOrMisc =
//               item.description.toLowerCase() === "auditorium" ||
//               item.item_no === "14";

//             const isCTMRequired =
//               aidRequest.paid_course_or_not === "Yes" && item.item_no === "03";

//             const baseValid =
//               item.item_no &&
//               item.description.trim() &&
//               item.quantity > 0 &&
//               item.remark.trim();

//             const mdValid = isAuditoriumOrMisc
//               ? item.md_approval_required_or_not.trim() &&
//                 item.md_approval_obtained.trim()
//               : true;

//             const ctmValid = isCTMRequired
//               ? item.CTM_approval_obtained?.trim() && item.CTM_Details?.trim()
//               : true;

//             return baseValid && mdValid && ctmValid;
//           });

//         return step1Valid && step2Valid && step3Valid && step4Valid;

//       default:
//         return false;
//     }
//   };

//   const nextStep = () => {
//     if (validateStep()) {
//       setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
//     } else {
//       alert("Please fill in all required fields on this step.");
//     }
//   };

//   const prevStep = () => {
//     setCurrentStep((prev) => Math.max(prev - 1, 1));
//   };

//   const renderAidRequestField = (
//     field,
//     aidRequest,
//     handleChange,
//     today,
//     timeOptions,
//     handlePreferredDaysChange,
//     groupedCourseOptions,
//     dayOptions,
//     classroomOptions
//   ) => {
//     if (field === "request_status" || field === "payment_status") return null;

//     const label = field.replaceAll("_", " ");

//     switch (field) {
//       case "course_name":
//         return (
//           <div key={field} className={getClassName()}>
//             <CreatableSelect
//               isClearable
//               options={groupedCourseOptions}
//               onChange={(selectedOption) =>
//                 handleChange({
//                   target: {
//                     name: "course_name",
//                     value: selectedOption ? selectedOption.value : "",
//                   },
//                 })
//               }
//               value={
//                 aidRequest.course_name
//                   ? {
//                       label: aidRequest.course_name,
//                       value: aidRequest.course_name,
//                     }
//                   : null
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || hasValue ? "active" : ""}
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "preferred_days_of_week":
//         return (
//           <div key={field} className={getClassName()}>
//             <Select
//               isMulti
//               name={field}
//               options={validDayOptions}
//               value={
//                 Array.isArray(aidRequest[field])
//                   ? dayOptions.filter((option) =>
//                       aidRequest[field].includes(option.value)
//                     )
//                   : []
//               }
//               onChange={handlePreferredDaysChange}
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={
//                 isFocused || aidRequest[field]?.length > 0 ? "active" : ""
//               }
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "paid_course_or_not":
//         return (
//           <div key={field} className={getClassName()}>
//             <Select
//               name={field}
//               options={[
//                 { value: "Yes", label: "Yes" },
//                 { value: "No", label: "No" },
//               ]}
//               value={
//                 aidRequest[field]
//                   ? { value: aidRequest[field], label: aidRequest[field] }
//                   : null
//               }
//               onChange={(selected) =>
//                 handleChange({ target: { name: field, value: selected.value } })
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || aidRequest[field] !== "" ? "active" : ""}
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "audience_type":
//         return (
//           <div key={field} className={getClassName()}>
//             <Select
//               name={field}
//               options={[
//                 { value: "Internal (SLPA)", label: "Internal (SLPA)" },
//                 { value: "External", label: "External" },
//                 { value: "Mixed", label: "Mixed" },
//               ]}
//               value={
//                 aidRequest[field]
//                   ? { value: aidRequest[field], label: aidRequest[field] }
//                   : null
//               }
//               onChange={(selected) =>
//                 handleChange({ target: { name: field, value: selected.value } })
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || aidRequest[field] !== "" ? "active" : ""}
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "date_from":
//       case "date_to":
//       case "signed_date":
//         const dateFrom = aidRequest["date_from"];

//         let inputProps = {
//           name: field,
//           value: aidRequest[field],
//           onChange: handleChange,
//           required: true,
//           placeholder: " ",
//           type: "date",
//           min: today,
//         };

//         if (field === "date_to") {
//           inputProps.disabled = !dateFrom;
//           if (dateFrom) inputProps.min = dateFrom;
//         }

//         return (
//           <div key={field} className={getClassName()}>
//             <input {...inputProps} />
//             <label htmlFor={field}>{label}</label>
//           </div>
//         );

//       case "time_from":
//       case "time_to":
//         // For convenience, get current times from state
//         const timeFromValue = aidRequest["time_from"];
//         const timeToValue = aidRequest["time_to"];

//         // Filtered options for time_to only:
//         const filteredTimeOptions =
//           field === "time_to"
//             ? timeOptions.filter(
//                 (time) => !timeFromValue || time.value > timeFromValue
//               )
//             : timeOptions;

//         return (
//           <div key={field} className={getClassName()}>
//             <select
//               name={field}
//               value={aidRequest[field]}
//               onChange={(e) => {
//                 handleChange(e);

//                 if (field === "time_from") {
//                   const newTimeFrom = e.target.value;
//                   if (timeToValue && timeToValue <= newTimeFrom) {
//                     handleChange({ target: { name: "time_to", value: "" } }); // clear time_to
//                   }
//                 }
//               }}
//               required
//               placeholder=" "
//               disabled={field === "time_to" && !timeFromValue} // disable time_to if no time_from
//             >
//               <option value="">Select Time</option>
//               {filteredTimeOptions.map((time) => (
//                 <option key={time.value} value={time.value}>
//                   {time.label}
//                 </option>
//               ))}
//             </select>
//             <label
//               className={
//                 aidRequest[field] !== "" && aidRequest[field] !== undefined
//                   ? "active"
//                   : ""
//               }
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "classrooms_allocated":
//         return (
//           <div key={field} className={getClassName()}>
//             <Select
//               isMulti
//               name={field}
//               options={classroomOptions}
//               value={classroomOptions.filter(
//                 (opt) =>
//                   Array.isArray(aidRequest.classrooms_allocated) &&
//                   aidRequest.classrooms_allocated.includes(opt.value)
//               )}
//               onChange={(selected) =>
//                 setAidRequest((prev) => ({
//                   ...prev,
//                   classrooms_allocated: selected.map((s) => s.value),
//                 }))
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={
//                 isFocused || aidRequest.classrooms_allocated.length > 0
//                   ? "active"
//                   : ""
//               }
//               htmlFor={field}
//             >
//               Classrooms Requested (optional)
//             </label>
//           </div>
//         );

//       case "exam_or_not":
//         return (
//           <div key={field} className={getClassName()}>
//             <Select
//               name={field}
//               options={[
//                 { value: "Yes", label: "Yes" },
//                 { value: "No", label: "No" },
//               ]}
//               value={{
//                 value: aidRequest.exam_or_not,
//                 label: aidRequest.exam_or_not,
//               }}
//               onChange={(selected) =>
//                 setAidRequest((prev) => ({
//                   ...prev,
//                   exam_or_not: selected.value,
//                 }))
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || aidRequest.exam_or_not ? "active" : ""}
//               htmlFor={field}
//             >
//               Exam or Not
//             </label>
//           </div>
//         );

//       default:
//         return (
//           <div key={field} className={getClassName()}>
//             <input
//               type={field === "no_of_participants" ? "number" : "text"}
//               name={field}
//               value={aidRequest[field]}
//               onChange={handleChange}
//               min="1"
//               required
//               placeholder=" "
//             />
//             <label htmlFor={field}>{label}</label>
//           </div>
//         );
//     }
//   };

//   const renderAidItemField = (field, item, index, handleChange, handleBlur) => {
//     const label = field.replaceAll("_", " ");
//     const isAuditoriumOrMisc =
//       item.description.toLowerCase() === "auditorium" || item.item_no === "14";

//     const shouldShowCTMFields =
//       aidRequest.paid_course_or_not === "Yes" && item.item_no === "03";

//     switch (field) {
//       case "item_no":
//         return (
//           <div key={field} className="form-step">
//             <Select
//               name={field}
//               options={Array.from({ length: 14 }, (_, i) => {
//                 const value = (i + 1).toString().padStart(2, "0");
//                 const description = itemDescriptionMapping[value] || "";
//                 return {
//                   value,
//                   label: `${value} (${description})`,
//                 };
//               })}
//               value={
//                 item[field] ? { value: item[field], label: item[field] } : null
//               }
//               onChange={(selected) =>
//                 handleChange(index, {
//                   target: { name: field, value: selected.value },
//                 })
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || item[field] !== "" ? "active" : ""}
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "description":
//         return (
//           <div key={field} className="form-step">
//             <input
//               type="text"
//               name={field}
//               value={item[field]}
//               onChange={(e) => handleChange(index, e)}
//               onBlur={(e) => handleBlur(index, e)}
//               readOnly={item.item_no !== "14"}
//               required
//               placeholder=" "
//             />
//             <label htmlFor={field}>{label}</label>
//           </div>
//         );

//       case "quantity":
//         return (
//           <div key={field} className="form-step">
//             <input
//               type="number"
//               name={field}
//               value={item[field]}
//               onChange={(e) => handleChange(index, e)}
//               min="1"
//               required
//               placeholder=" "
//             />
//             <label htmlFor={field}>{label}</label>
//           </div>
//         );

//       case "md_approval_required_or_not":
//         if (!isAuditoriumOrMisc) return null;
//         return (
//           <div key={field} className="form-step">
//             <Select
//               name={field}
//               options={[
//                 { value: "Yes", label: "Yes" },
//                 { value: "No", label: "No" },
//               ]}
//               value={{ value: item[field], label: item[field] }}
//               onChange={(selected) =>
//                 handleChange(index, {
//                   target: { name: field, value: selected.value },
//                 })
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || item[field] ? "active" : ""}
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "md_approval_obtained":
//         if (!isAuditoriumOrMisc) return null;
//         return (
//           <div key={field} className="form-step">
//             <Select
//               name={field}
//               options={[
//                 { value: "Yes", label: "Yes" },
//                 { value: "No", label: "No" },
//               ]}
//               value={
//                 item[field] ? { value: item[field], label: item[field] } : null
//               }
//               onChange={(selected) =>
//                 handleChange(index, {
//                   target: { name: field, value: selected.value },
//                 })
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || item[field] ? "active" : ""}
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "md_approval_details": {
//         if (!isAuditoriumOrMisc) return null;
//         return (
//           <div key={field} className="form-step">
//             <input
//               type="text"
//               name={field}
//               value={item[field]}
//               onChange={(e) => handleChange(index, e)}
//               required
//               placeholder=" "
//             />
//             <label htmlFor={field}>{label}</label>
//           </div>
//         );
//       }

//       case "CTM_approval_obtained":
//         if (!shouldShowCTMFields) return null;
//         return (
//           <div key={field} className="form-step">
//             <Select
//               name={field}
//               options={[
//                 { value: "Yes", label: "Yes" },
//                 { value: "No", label: "No" },
//               ]}
//               value={
//                 item[field] ? { value: item[field], label: item[field] } : null
//               }
//               onChange={(selected) =>
//                 handleChange(index, {
//                   target: { name: field, value: selected.value },
//                 })
//               }
//               placeholder=" "
//               styles={customSelectStyles}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//             />
//             <label
//               className={isFocused || item[field] ? "active" : ""}
//               htmlFor={field}
//             >
//               {label}
//             </label>
//           </div>
//         );

//       case "CTM_Details":
//         if (!shouldShowCTMFields) return null;
//         return (
//           <div key={field} className="form-step">
//             <input
//               type="text"
//               name={field}
//               value={item[field] || ""}
//               onChange={(e) => handleChange(index, e)}
//               required={shouldShowCTMFields}
//               placeholder=" "
//             />
//             <label htmlFor={field}>{label}</label>
//           </div>
//         );

//       default:
//         return (
//           <div key={field} className="form-step">
//             <input
//               type="text"
//               name={field}
//               value={item[field]}
//               onChange={(e) => handleChange(index, e)}
//               required
//               placeholder=" "
//             />
//             <label htmlFor={field}>{label}</label>
//           </div>
//         );
//     }
//   };

//   const renderStep = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <>
//             <p
//               className="page-description-type2"
//               style={{ fontWeight: "bold", textAlign: "center" }}
//             >
//               Step 1: Requesting Officer & Course Details
//             </p>
//             <div className="step-two-grid">
//               {[
//                 "requesting_officer_name",
//                 "designation",
//                 "requesting_officer_email",
//                 "course_name",
//                 "duration",
//                 "audience_type",
//               ].map((field) =>
//                 renderAidRequestField(
//                   field,
//                   aidRequest,
//                   handleAidRequestChange,
//                   today,
//                   timeOptions,
//                   handlePreferredDaysChange,
//                   groupedCourseOptions,
//                   dayOptions,
//                   classroomOptions
//                 )
//               )}
//             </div>
//           </>
//         );
//       case 2:
//         return (
//           <>
//             <p
//               className="page-description-type2"
//               style={{ fontWeight: "bold", textAlign: "center" }}
//             >
//               Step 2: Participants, Coordinator & Date/Time
//             </p>
//             <div className="step-two-grid">
//               {[
//                 "no_of_participants",
//                 "course_coordinator",
//                 "date_from",
//                 "date_to",
//                 "time_from",
//                 "time_to",
//               ].map((field) =>
//                 renderAidRequestField(
//                   field,
//                   aidRequest,
//                   handleAidRequestChange,
//                   today,
//                   timeOptions,
//                   handlePreferredDaysChange,
//                   groupedCourseOptions,
//                   dayOptions,
//                   classroomOptions
//                 )
//               )}
//             </div>
//           </>
//         );
//       case 3:
//         return (
//           <>
//             <p
//               className="page-description-type2"
//               style={{ fontWeight: "bold", textAlign: "center" }}
//             >
//               Step 3: Preferences & Sign-Off
//             </p>
//             <div className="centered-form-section">
//               {[
//                 "preferred_days_of_week",
//                 "paid_course_or_not",
//                 "signed_date",
//                 "classrooms_allocated",
//                 "exam_or_not",
//               ].map((field) =>
//                 renderAidRequestField(
//                   field,
//                   aidRequest,
//                   handleAidRequestChange,
//                   today,
//                   timeOptions,
//                   handlePreferredDaysChange,
//                   groupedCourseOptions,
//                   dayOptions,
//                   classroomOptions
//                 )
//               )}
//             </div>
//           </>
//         );
//       case 4:
//         return (
//           <>
//             <p
//               className="page-description-type2"
//               style={{ fontWeight: "bold", textAlign: "center" }}
//             >
//               Step 4: Add Aid Items
//             </p>
//             {aidItems.map((item, index) => (
//               <div key={index} className="aid-item">
//                 <div className="step-two-grid">
//                   {Object.keys(item).map((field) =>
//                     renderAidItemField(
//                       field,
//                       item,
//                       index,
//                       handleAidItemChange,
//                       handleAidItemBlur
//                     )
//                   )}
//                 </div>
//                 <button
//                   type="button"
//                   className="add-itemsbtn"
//                   onClick={() => removeAidItem(index)}
//                 >
//                   Remove Item
//                 </button>
//               </div>
//             ))}
//             <button type="button" className="add-itemsbtn" onClick={addAidItem}>
//               Add Item
//             </button>
//           </>
//         );
//       case 5:
//         return (
//           <>
//             <p
//               className="page-description-type2"
//               style={{ fontWeight: "bold", textAlign: "center" }}
//             >
//               Step 5: Confirm your details and submit
//             </p>
//             <div className="review-grid-1">
//               {Object.entries(aidRequest).map(([key, val]) =>
//                 key !== "request_status" &&
//                 key !== "payment_status" &&
//                 key !== "cancelled_by_requester" ? (
//                   <p key={key}>
//                     <strong>
//                       {key === "classrooms_allocated"
//                         ? "Classroom(s) Requested"
//                         : key.replaceAll("_", " ")}
//                       :
//                     </strong>{" "}
//                     {val === null ||
//                     val === undefined ||
//                     val === "" ||
//                     (Array.isArray(val) && val.length === 0)
//                       ? "-"
//                       : Array.isArray(val)
//                       ? val.join(", ")
//                       : val}
//                   </p>
//                 ) : null
//               )}
//             </div>
//             <div className="review-items">
//               {aidItems.length > 0 && (
//                 <>
//                   <p
//                     className="page-description-type2"
//                     style={{
//                       fontWeight: "bold",
//                       textAlign: "center",
//                       display: "block",
//                     }}
//                   >
//                     Aid Items:
//                   </p>
//                   {aidItems.map((item, index) => (
//                     <div key={index} style={{ gridColumn: "1 / -1" }}>
//                       {Object.entries(item).map(([key, val]) => {
//                         const shouldShowCTMFields =
//                           aidRequest.paid_course_or_not === "Yes" &&
//                           item.item_no === "03";

//                         const isAuditoriumOrMisc =
//                           item.description.toLowerCase().trim() ===
//                             "auditorium" || item.item_no === "14";

//                         // Skip CTM fields if condition not met
//                         if (
//                           (key === "CTM_approval_obtained" ||
//                             key === "CTM_Details") &&
//                           !shouldShowCTMFields
//                         ) {
//                           return null;
//                         }

//                         if (
//                           (key === "md_approval_required_or_not" ||
//                             key === "md_approval_obtained" ||
//                             key === "md_approval_details") &&
//                           !isAuditoriumOrMisc
//                         ) {
//                           return null;
//                         }
//                         const displayValue =
//                           (key === "md_approval_details" ||
//                             key === "CTM_Details") &&
//                           (!val || !val.trim())
//                             ? "-"
//                             : val;

//                         return (
//                           <p key={key}>
//                             <strong>{key.replaceAll("_", " ")}:</strong>{" "}
//                             {displayValue}
//                           </p>
//                         );
//                       })}
//                     </div>
//                   ))}
//                 </>
//               )}
//             </div>
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   const customSelectStyles = {
//     control: (provided, state) => ({
//       ...provided,
//       backgroundColor: "transparent",
//       borderColor: state.isFocused ? "#01eeff" : "#00a6ff9d",
//       borderWidth: 3,
//       borderRadius: 4,
//       padding: "0px",
//       minHeight: "32px", // Shrinks overall height
//       boxShadow: "none",
//       cursor: "pointer",
//       color: "#e3eaf5",
//       fontSize: "12px",
//       "&:hover": {
//         borderColor: "#01eeff",
//       },
//     }),
//     valueContainer: (provided) => ({
//       ...provided,
//       padding: "2px 6px",
//       fontSize: "12px",
//     }),
//     placeholder: (provided) => ({
//       ...provided,
//       color: "#999",
//       fontSize: "12px",
//     }),
//     input: (provided) => ({
//       ...provided,
//       color: "#fff",
//       fontSize: "12px",
//       margin: 0,
//       padding: 0,
//     }),
//     singleValue: (provided) => ({
//       ...provided,
//       color: "#fff",
//       fontSize: "12px",
//     }),
//     menu: (provided) => ({
//       ...provided,
//       backgroundColor: "#003b5a",
//       color: "#e3eaf5",
//       borderRadius: 4,
//       fontSize: "10px", // Menu font size can stay small
//     }),
//     option: (provided, state) => ({
//       ...provided,
//       backgroundColor: state.isFocused ? "#01eeff" : "transparent",
//       color: state.isFocused ? "black" : "#e3eaf5",
//       cursor: "pointer",
//       fontSize: "12px",
//       padding: "6px 10px", // Still gives clickable area
//     }),
//     multiValue: (provided) => ({
//       ...provided,
//       backgroundColor: "#00fff253",
//       borderRadius: 4,
//       fontSize: "11px",
//       margin: "2px 4px",
//     }),
//     multiValueLabel: (provided) => ({
//       ...provided,
//       color: "#fff",
//       fontSize: "11px",
//     }),
//     multiValueRemove: (provided) => ({
//       ...provided,
//       color: "#fff",
//       fontSize: "11px",
//       ":hover": {
//         backgroundColor: "#01eeff",
//         color: "black",
//       },
//     }),
//     dropdownIndicator: (provided) => ({
//       ...provided,
//       padding: "8.8px 7px",
//       svg: {
//         width: "16px", // reduce arrow size
//         height: "16px",
//       },
//     }),

//     clearIndicator: (provided) => ({
//       ...provided,
//       padding: "8.8px 7px",
//       svg: {
//         width: "16px", // reduce × icon size
//         height: "16px",
//       },
//     }),
//   };

//   const [isFocused, setIsFocused] = useState(false);

//   const hasValue = !!aidRequest.course_name;

//   return (
//     <>
//       {successMessage && <SuccessPopup message={successMessage} />}
//       <form
//         onSubmit={handleSubmit}
//         className="aid-request-form-type2"
//         id="aidh2"
//       >
//         <div className="page-header">
//           <h1>Create Classroom/Aid Request</h1>
//         </div>

//         <div className="progressbar-container">
//           {[...Array(totalSteps)].map((_, index) => {
//             const stepNum = index + 1;
//             const isCompleted = stepNum < currentStep;
//             const isActive = stepNum === currentStep;

//             return (
//               <React.Fragment key={stepNum}>
//                 <div
//                   className={`progress-step ${isActive ? "active" : ""} ${
//                     isCompleted ? "completed" : ""
//                   }`}
//                 >
//                   <div className="circle">{stepNum}</div>
//                 </div>
//                 {stepNum !== totalSteps && (
//                   <div
//                     className={`line ${isCompleted ? "completed" : ""}`}
//                   ></div>
//                 )}
//               </React.Fragment>
//             );
//           })}
//         </div>

//         {renderStep()}

//         <div className="form-buttons-sticky">
//           <div className="navigation-buttons">
//             {currentStep > 1 && (
//               <button type="button" onClick={prevStep}>
//                 Back
//               </button>
//             )}
//             {currentStep < totalSteps && (
//               <button type="button" onClick={nextStep}>
//                 Next
//               </button>
//             )}
//             {currentStep === totalSteps && (
//               <button type="submit" disabled={isSubmitting}>
//                 {isSubmitting ? "Submitting..." : "Submit Aid Request"}
//               </button>
//             )}
//           </div>

//           <div className="button-section-aid_req">
//             <button
//               type="button"
//               className="clsrform"
//               onClick={() =>
//                 clearAndRefresh(["aidRequestData", "aidItemsData"])
//               }
//             >
//               Clear Request Form
//             </button>
//             <button
//               type="button"
//               className="clsrform"
//               onClick={() => navigate("/cancelRequestByUser")}
//             >
//               Cancel Booked Request
//             </button>
//           </div>
//         </div>
//       </form>
//     </>
//   );
// };

// export default AidRequestForm;
