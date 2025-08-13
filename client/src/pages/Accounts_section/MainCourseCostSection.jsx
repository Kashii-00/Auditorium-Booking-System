// File: MainCourseCostSection.jsx
import React, { useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";

import {
  groupedCourseOptions,
  courseToStreamMap,
} from "../Classroom_Booking/aidUtils";

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
  useEffect(() => {
    localStorage.setItem("draftMainCourseForm", JSON.stringify(formData));
  }, [formData]);

  const handleChange = ({ target: { name, value } }) =>
    setFormData((p) => ({ ...p, [name]: value }));

  const renderInputField = (name, label, type = "text") => (
    <div className="form-step" key={name}>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder=" "
        className="floating-label-input"
        onFocus={() => setFocused((p) => ({ ...p, [name]: true }))}
        onBlur={() => setFocused((p) => ({ ...p, [name]: false }))}
      />
      <label className={focused[name] || formData[name] ? "active" : ""}>
        {label}
      </label>
    </div>
  );

  const renderSelectField = (name, label, options) => (
    <div className="form-step" key={name}>
      <Select
        styles={customSelectStyles}
        name={name}
        options={options.map((val) => ({ label: val, value: val }))}
        value={
          formData[name]
            ? { value: formData[name], label: formData[name] }
            : null
        }
        onChange={(selected) =>
          setFormData((p) => ({ ...p, [name]: selected?.value || "" }))
        }
        placeholder=" "
        isClearable
      />
      <label className={formData[name] ? "active2" : ""}>{label}</label>
    </div>
  );

  return (
    <div className="mainCostCon">
      <h2 className="page-description-type2 h2-type2">
        Fill Out Payment Main Details
      </h2>

      {successMessage && <div className="success-popup2">{successMessage}</div>}
      {error && <div className="error-popup2">{error}</div>}

      {!reviewMode ? (
        <>
          <form className="step-two-grid aid-request-form-type2">
            {/* {renderInputField("course_id", "Course ID", "number")}
            {renderInputField("batch_id", "Batch ID", "number")} */}

            <div className="form-step" key="course_name">
              <CreatableSelect
                isClearable
                styles={customSelectStyles}
                options={groupedCourseOptions}
                value={
                  formData.course_name
                    ? {
                        value: formData.course_name,
                        label: formData.course_name,
                      }
                    : null
                }
                onChange={(selected) => {
                  const selectedCourse = selected?.value || "";
                  const derivedStream = courseToStreamMap[selectedCourse] || "";
                  setFormData((prev) => ({
                    ...prev,
                    course_name: selectedCourse,
                    stream: derivedStream,
                  }));
                }}
                placeholder=" "
              />
              <label className={formData.course_name ? "active2" : ""}>
                Course Name
              </label>
            </div>

            {renderInputField(
              "no_of_participants",
              "No. of Participants",
              "number"
            )}
            {renderInputField("duration", "Duration")}

            {renderSelectField("customer_type", "Customer Type", [
              "Internal",
              "External",
              "Mixed",
            ])}

            <div className="form-step" key="stream">
              <CreatableSelect
                isClearable
                styles={customSelectStyles}
                options={groupedCourseOptions.map((group) => ({
                  value: group.label,
                  label: group.label,
                }))}
                value={
                  formData.stream
                    ? { value: formData.stream, label: formData.stream }
                    : null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    stream: selected ? selected.value : "",
                  }))
                }
                placeholder=" "
              />
              <label className={formData.stream ? "active2" : ""}>Stream</label>
            </div>
            {renderInputField("date", "Date", "date")}
          </form>

          <div className="form-buttons-sticky btnHalf">
            <div className="navigation-buttons">
              <button
                type="button"
                className="ccfbtn"
                onClick={() => setReviewMode(true)}
              >
                Review
              </button>
              <button type="button" className="ccfbtn" onClick={handleClear}>
                Clear Form
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="reviewCon">
          <h3 className="page-description-type3">Review Before Submission</h3>
          <div className="review-grid-1">
            {Object.entries(formData).map(([key, val]) => (
              <p key={key}>
                <strong>{key.replaceAll("_", " ")}:</strong>{" "}
                <p className="valueTxt">{val || "-"}</p>
              </p>
            ))}
          </div>
          <div className="form-buttons-sticky btnHalf">
            <div className="navigation-buttons navbtn2">
              <button
                type="button"
                className="ccfbtn"
                onClick={() => setReviewMode(false)}
              >
                Back
              </button>
              <button
                className="ccfbtn"
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <button type="button" className="ccfbtn" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainCourseCostSection;
