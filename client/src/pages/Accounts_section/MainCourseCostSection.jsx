// File: MainCourseCostSection.jsx
import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
  DollarSign,
  Calculator,
  UserCheck,
} from "lucide-react";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "white",
    borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
    borderWidth: "1px",
    borderRadius: "6px",
    padding: "0px",
    minHeight: "40px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.1)" : "none",
    cursor: "pointer",
    color: "#1e293b",
    fontSize: "14px",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "8px 12px",
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
    borderRadius: "6px",
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

const MainCourseCostSection = ({
  formData,
  setFormData,
  focused,
  setFocused,
  reviewMode,
  setReviewMode,
  isSubmitting,
  successMessage,
  error,
  handleSubmit,
  handleClear,
}) => {
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(() => {
    const saved = localStorage.getItem("isManualEntry");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("draftMainCourseForm", JSON.stringify(formData));
  }, [formData]);

  // Save manual entry state to localStorage
  useEffect(() => {
    localStorage.setItem("isManualEntry", JSON.stringify(isManualEntry));
  }, [isManualEntry]);

  // Auto-detect manual entry mode when form data is restored from localStorage
  useEffect(() => {
    // Only auto-detect if we haven't explicitly set the manual entry state
    const savedManualEntry = localStorage.getItem("isManualEntry");
    if (savedManualEntry === null && formData.course_name && !formData.course_id) {
      // If we have a course name but no course_id and no saved manual entry state, it's likely a manual entry
      setIsManualEntry(true);
    }
  }, [formData.course_name, formData.course_id]);

  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const response = await authRequest("get", getApiUrl("/CourseRegistrationRoute"));
        setCourses(response);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const handleChange = ({ target: { name, value } }) =>
    setFormData((p) => ({ ...p, [name]: value }));

  // Handle course selection
  const handleCourseChange = (selected) => {
    if (selected) {
      const selectedCourse = courses.find(course => course.id === selected.value);
      if (selectedCourse) {
        setFormData((prev) => ({
          ...prev,
          course_id: selectedCourse.id,
          course_name: selectedCourse.courseName,
          stream: selectedCourse.stream,
          duration: selectedCourse.duration,
          no_of_participants: selectedCourse.no_of_participants || 25,
        }));
      }
    } else {
      // Clear course-related fields when no course is selected
      setFormData((prev) => ({
        ...prev,
        course_id: "",
        course_name: "",
        stream: "",
        duration: "",
        no_of_participants: "",
      }));
    }
  };

  // Prepare course options for the dropdown
  const courseOptions = courses.map(course => ({
    value: course.id,
    label: `${course.courseName} (${course.courseId}) - ${course.stream}`,
  }));

  const SuccessPopup = ({ message }) => (
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-lg">{message}</p>
          <p className="text-emerald-100 text-sm">Your course cost details have been saved successfully</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {successMessage && <SuccessPopup message={successMessage} />}
      
      <div className="w-full max-w-8xl mx-auto">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">

          <CardContent className="p-6">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {!reviewMode ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    Main Course Cost Details
                  </h2>
                  <p className="text-slate-600">Please provide the course and participant information for cost calculation.</p>
                </div>

                {/* Manual Entry Checkbox */}
                <div className="col-span-full mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="manual-entry"
                      checked={isManualEntry}
                      onCheckedChange={(checked) => {
                        setIsManualEntry(checked);
                        if (checked) {
                          // Clear course selection when switching to manual entry
                          setFormData((prev) => ({
                            ...prev,
                            course_id: "",
                            course_name: "",
                            stream: "",
                            duration: "",
                            no_of_participants: "",
                          }));
                        } else {
                          // Clear manual entry when switching back to database selection
                          setFormData((prev) => ({
                            ...prev,
                            course_id: "",
                            course_name: "",
                            stream: "",
                            duration: "",
                            no_of_participants: "",
                          }));
                        }
                      }}
                    />
                    <label
                      htmlFor="manual-entry"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enter course details manually
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Course Selection/Entry */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {isManualEntry ? "Course Name *" : "Select Course *"}
                    </label>
                    {isManualEntry ? (
                      <Input
                        type="text"
                        name="course_name"
                        value={formData.course_name}
                        onChange={handleChange}
                        placeholder="Enter course name manually"
                        className="w-full"
                      />
                    ) : (
                      <Select
                        styles={customSelectStyles}
                        options={courseOptions}
                        value={
                          formData.course_id
                            ? courseOptions.find(option => option.value === formData.course_id)
                            : null
                        }
                        onChange={handleCourseChange}
                        isClearable
                        isLoading={isLoadingCourses}
                        isDisabled={isLoadingCourses}
                        placeholder="Select a course..."
                      />
                    )}
                  </div>

                  {/* Number of Participants */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {isManualEntry ? "No. of Participants *" : "No. of Participants (Auto-populated from course)"}
                    </label>
                    <Input
                      type="number"
                      name="no_of_participants"
                      value={formData.no_of_participants}
                      onChange={handleChange}
                      placeholder={isManualEntry ? "Enter number of participants" : "Auto-populated"}
                      className={`w-full ${!isManualEntry ? "bg-slate-50 text-slate-600" : ""}`}
                      readOnly={!isManualEntry}
                    />
                  </div>

                  {/* Duration field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {isManualEntry ? "Duration *" : "Duration (Auto-populated from course)"}
                    </label>
                    <Input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder={isManualEntry ? "Enter duration (e.g., 6 days)" : "Enter duration"}
                      className="w-full"
                    />
                  </div>

                  {/* Customer Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Customer Type *
                    </label>
                    <Select
                      styles={customSelectStyles}
                      options={[
                        { value: "Internal", label: "Internal" },
                        { value: "External", label: "External" },
                        { value: "Mixed", label: "Mixed" },
                      ]}
                      value={
                        formData.customer_type
                          ? { value: formData.customer_type, label: formData.customer_type }
                          : null
                      }
                      onChange={(selected) =>
                        setFormData((p) => ({ ...p, customer_type: selected?.value || "" }))
                      }
                      placeholder="Select customer type..."
                    />
                  </div>

                  {/* Stream field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {isManualEntry ? "Stream *" : "Stream (Auto-populated from course)"}
                    </label>
                    <Input
                      type="text"
                      name="stream"
                      value={formData.stream}
                      onChange={handleChange}
                      placeholder={isManualEntry ? "Enter stream (e.g., Maritime)" : "Enter stream"}
                      className="w-full"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Date *
                    </label>
                    <Input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-slate-200">
                  <div className="flex gap-3">
                  <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 rounded-xl font-bold"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear Form
                    </Button>
                  </div>

                  <div className="flex gap-3">
                  <Button
                      type="button"
                      onClick={() => setReviewMode(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Review Details
                    </Button>
                    
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                    Review Before Submission
                  </h2>
                  <p className="text-slate-600">Please review all information before submitting your course cost details.</p>
                </div>

                <Card className="border border-slate-200 bg-slate-50/50">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Entry Type Indicator */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className={`${isManualEntry ? 'bg-orange-500' : 'bg-blue-500'} text-white px-3 py-1 rounded-full`}>
                          {isManualEntry ? 'Manual Entry' : 'Database Course'}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {isManualEntry ? 'Course details entered manually' : 'Course selected from database'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData).map(([key, val]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-sm font-semibold text-slate-600 capitalize">
                              {key.replaceAll("_", " ")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {val || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Review Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-slate-200">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewMode(false)}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Edit
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Submit Course Cost
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 rounded-xl font-bold"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear Form
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MainCourseCostSection;
