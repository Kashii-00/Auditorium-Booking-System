import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./styles/C_Registration.css";
import SuccessPopup from "./styles/SuccessPopup";
import PaymentConditionsPopup from "./styles/PaymentConditionsPopup";
import { authRequest } from '../../services/authService';

const steps = [
  { label: "Basic Info" },
  { label: "Details" },
  { label: "Resources" },
  { label: "Payment" }
];

const resourceTabs = [
  { key: "assessment", label: "Assessment" },
  { key: "resources", label: "Resources" }
];

function C_Registration() {
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [courseIdError, setCourseIdError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentConditions, setShowPaymentConditions] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [resourceTab, setResourceTab] = useState("resources"); // default to "resources" as in screenshot

  // Payment state
  const [installments, setInstallments] = useState([
    { label: "Installment 1", value: "", weeks: "", enabled: false },
    { label: "Installment 2", value: "", weeks: "", enabled: false }
  ]);

  // Sidebar state for interaction
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    location.state?.sidebarState ?? false
  );

  // Sidebar event listeners
  useEffect(() => {
    // Always sync sidebar state from localStorage on mount and on popstate
    const syncSidebarState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) {
        const isCollapsed = stored === 'true';
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
          detail: { isCollapsed }
        }));
      }
    };

    // On mount, sync sidebar state
    syncSidebarState();

    // Listen for browser back/forward navigation and sync sidebar state
    window.addEventListener('popstate', syncSidebarState);

    const handleSidebarToggle = (e) => setSidebarCollapsed(e.detail.isCollapsed);
    const handleSidebarHover = (e) => setSidebarCollapsed(!e.detail.isHovered);

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('sidebarHover', handleSidebarHover);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('sidebarHover', handleSidebarHover);
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, []);

  // Initial form state
  const [formData, setFormData] = useState({
    courseId: "",
    stream: "",
    courseName: "",
    medium: [],
    location: [],
    assessmentCriteria: [],
    resources: [],
    fees: "", // keep as the only fee field
    registrationFee: "",
    installment1: "",
    installment2: "",
    additionalInstallments: []
  });

  // Validation similar to EventCalendar
  const validateForm = () => {
    const newErrors = {};
    if (activeStep === 0) {
      if (!formData.courseId.trim()) newErrors.courseId = 'Course ID is required';
      if (!formData.stream.trim()) newErrors.stream = 'Stream is required';
      if (!formData.courseName.trim()) newErrors.courseName = 'Course Name is required';
    }
    if (activeStep === 1) {
      if (!formData.medium.length) newErrors.medium = 'Select at least one medium';
      if (!formData.location.length) newErrors.location = 'Select at least one location';
    }
    if (activeStep === 2) {
      if (!formData.assessmentCriteria.length) newErrors.assessmentCriteria = 'Select at least one assessment criteria';
      if (!formData.resources.length) newErrors.resources = 'Select at least one resource';
      if (!formData.fees || isNaN(Number(formData.fees)) || Number(formData.fees) <= 0) newErrors.fees = 'Enter a valid fee amount';
    }
    if (activeStep === 3) {
      const base = Number(formData.fees) || 0;
      const regFee = Number(formData.registrationFee);
      if (!formData.registrationFee || isNaN(regFee) || regFee <= 0) {
        newErrors.registrationFee = 'Registration fee is required and must be greater than 0';
      }
      installments.forEach((inst, idx) => {
        if (inst.enabled && (!inst.value || isNaN(Number(inst.value)) || Number(inst.value) <= 0)) {
          newErrors[`installment${idx+1}`] = `${inst.label} is required and must be greater than 0`;
        }
      });
      const sum = installments.reduce((acc, inst) => acc + (inst.enabled ? (Number(inst.value) || 0) : 0), 0);
      if (base <= 0) newErrors.fees = 'Base fee required';
      if ((sum + regFee) > base) newErrors.installments = 'Installments + Registration Fee exceed base fee';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "courseId") setCourseIdError("");
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e, field) => {
    const { id, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], id]
        : prev[field].filter(item => item !== id)
    }));
  };

  // Payment step: handle installment value/period changes
  const handleInstallmentChange = (idx, field, val) => {
    setInstallments(prev =>
      prev.map((inst, i) =>
        i === idx ? { ...inst, [field]: val } : inst
      )
    );
  };

  // Toggle enable/disable for installment
  const handleInstallmentToggle = (idx) => {
    setInstallments(prev =>
      prev.map((inst, i) =>
        i === idx ? { ...inst, enabled: !inst.enabled, value: !inst.enabled ? inst.value : "", weeks: !inst.enabled ? inst.weeks : "" } : inst
      )
    );
  };

  // Add more installments
  const addInstallment = () => {
    setInstallments(prev => [
      ...prev,
      { label: `Installment ${prev.length + 1}`, value: "", weeks: "", enabled: false }
    ]);
  };

  // Remove an installment
  const removeInstallment = (idx) => {
    setInstallments(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate remaining amount (registrationFee should be + to the installments)
  const getRemainingAmount = () => {
    const base = Number(formData.fees) || 0;
    const regFee = Number(formData.registrationFee) || 0;
    const sum = installments.reduce((acc, inst) => acc + (inst.enabled ? (Number(inst.value) || 0) : 0), 0);
    // Remaining = base - (registrationFee + installments)
    return Math.max(0, base - (regFee + sum));
  };

  // Course ID validation
  const checkCourseId = async () => {
    if (!formData.courseId) {
      setCourseIdError("Course ID is required.");
      return;
    }
    try {
      const response = await authRequest(
        'get',
        `http://10.70.4.34:5007/api/CourseRegistrationRoute?courseId=${formData.courseId}`
      );
      let exists = false;
      if (Array.isArray(response)) {
        exists = response.some(course => course.courseId === formData.courseId);
      } else if (response.exists !== undefined) {
        exists = response.exists;
      }
      if (exists) {
        setCourseIdError("Course ID already exists, please choose another.");
      } else {
        setCourseIdError("");
      }
    } catch (error) {
      setCourseIdError("Error validating Course ID.");
    }
  };

  // Step navigation
  const handleNext = async (e) => {
    e.preventDefault();
    // Check for courseId existence before proceeding from step 0
    if (activeStep === 0) {
      await checkCourseId();
      // Prevent next if courseIdError is set after check
      if (courseIdError || !formData.courseId || !formData.stream || !formData.courseName) {
        setShowPopup(true);
        return;
      }
    }
    if (!validateForm()) return;
    if (activeStep < 3) setActiveStep(activeStep + 1);
    else await handleSubmit(e);
  };

  const handleBack = (e) => {
    e.preventDefault();
    if (activeStep > 0) setActiveStep(activeStep - 1);
    // No back navigation for step 0
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    try {
      // Always get user_id from localStorage user object
      const userStr = localStorage.getItem('user');
      let user_id = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          user_id = userObj.id;
        } catch {}
      }

      // Prepare payment fields for backend
      const totalFee = Number(formData.fees) || 0;
      const registrationFee = Number(formData.registrationFee) || 0;
      // Only enabled installments
      const enabledInstallments = installments.filter(inst => inst.enabled);
      const installment1 = enabledInstallments[0]?.value ? Number(enabledInstallments[0].value) : null;
      const installment2 = enabledInstallments[1]?.value ? Number(enabledInstallments[1].value) : null;
      const additionalInstallments = enabledInstallments.slice(2).map(inst => ({
        value: inst.value
      }));

      // Only send fees from resource tab as 'fees'
      const payload = {
        ...formData,
        user_id,
        fees: totalFee,
        registrationFee,
        installment1,
        installment2,
        additionalInstallments
      };

      // Remove dummy fields
      delete payload.weeks;
      delete payload.remainingAmount;

      const response = await authRequest(
        'post',
        "http://10.70.4.34:5007/api/CourseRegistrationRoute",
        payload
      );
      if (response && response.success) {
        setShowPopup(true);
        setCourseIdError("");
        setFormData({
          courseId: "",
          stream: "",
          courseName: "",
          medium: [],
          location: [],
          assessmentCriteria: [],
          resources: [],
          fees: "",
          registrationFee: "",
          installment1: "",
          installment2: "",
          additionalInstallments: []
        });
        setActiveStep(0);
        setTimeout(() => {
          setShowPopup(false);
        }, 2000);
      } else {
        setCourseIdError(response?.error || 'Failed to register course');
        setShowPopup(true);
      }
    } catch (error) {
      setCourseIdError(error.response?.data?.error || 'Failed to register course');
      setShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Stepper UI
  const renderStepper = () => (
    <div className="stepper-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      marginTop: 8
    }}>
      {steps.map((step, idx) => (
        <React.Fragment key={step.label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              className={`stepper-circle${idx < activeStep ? ' completed' : idx === activeStep ? ' active' : ''}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: idx < activeStep ? '#27ae60' : idx === activeStep ? '#2d9cdb' : '#e0e0e0',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 22,
                marginBottom: 4
              }}
            >
              {idx < activeStep ? <span>&#10003;</span> : idx + 1}
            </div>
            <div
              className={`stepper-label${idx === activeStep ? ' active' : ''}`}
              style={{
                color: idx === activeStep ? '#2d9cdb' : '#888',
                fontWeight: idx === activeStep ? 600 : 400,
                fontSize: 15,
                marginTop: 4
              }}
            >
              {step.label}
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`stepper-bar${idx < activeStep ? ' completed' : ''}`}
              style={{
                flex: 1,
                height: 4,
                background: idx < activeStep ? '#27ae60' : '#e0e0e0',
                margin: '0 8px',
                borderRadius: 2
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
            <div className="form-group-compact" style={{ marginBottom: 32 }}>
              <label className="form-label-compact" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Course ID <span className="required-compact">*</span>
                <span style={{ marginLeft: 8, color: '#bdbdbd', fontSize: '1rem', cursor: 'pointer' }} title="Unique identifier for the course">&#9432;</span>
              </label>
              <input
                type="text"
                className={`form-input-compact${errors.courseId ? ' error' : ''}`}
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                onBlur={checkCourseId}
                placeholder="KS189CA"
                style={{ fontSize: '1.1rem', padding: '18px 16px', marginBottom: 0 }}
              />
              {courseIdError && <div className="error-message-compact">{courseIdError}</div>}
            </div>
            <div className="form-group-compact" style={{ marginBottom: 32 }}>
              <label className="form-label-compact" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Stream <span className="required-compact">*</span>
              </label>
              <input
                type="text"
                className={`form-input-compact${errors.stream ? ' error' : ''}`}
                name="stream"
                value={formData.stream}
                onChange={handleInputChange}
                placeholder="MARITIME"
                style={{ fontSize: '1.1rem', padding: '18px 16px', marginBottom: 0 }}
              />
            </div>
            <div className="form-group-compact" style={{ marginBottom: 32 }}>
              <label className="form-label-compact" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Course Name <span className="required-compact">*</span>
              </label>
              <input
                type="text"
                className={`form-input-compact${errors.courseName ? ' error' : ''}`}
                name="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                placeholder="Technology"
                style={{ fontSize: '1.1rem', padding: '18px 16px', marginBottom: 0 }}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>Medium <span className="required-compact">*</span></div>
            <div style={{ color: '#6c757d', marginBottom: 24 }}>Select the language medium for this course</div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
              {["English", "Sinhala", "Tamil"].map((lang) => (
                <label key={lang} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: 12,
                  padding: '18px 24px',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: formData.medium.includes(lang) ? '0 0 0 2px #2d9cdb' : 'none',
                  transition: 'box-shadow 0.2s'
                }}>
                  <input
                    type="checkbox"
                    id={lang}
                    onChange={(e) => handleCheckboxChange(e, "medium")}
                    checked={formData.medium.includes(lang)}
                    style={{
                      marginRight: 12,
                      width: 22,
                      height: 22,
                      accentColor: formData.medium.includes(lang) ? '#2d9cdb' : '#e0e0e0'
                    }}
                  />
                  {lang}
                </label>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>Location <span className="required-compact">*</span></div>
            <div style={{ color: '#6c757d', marginBottom: 24 }}>Select where this course will be conducted</div>
            <div style={{ display: 'flex', gap: 24 }}>
              {["ClassRoom", "ComputerLab", "Other"].map((loc) => (
                <label key={loc} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: 12,
                  padding: '18px 24px',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: formData.location.includes(loc) ? '0 0 0 2px #2d9cdb' : 'none',
                  transition: 'box-shadow 0.2s'
                }}>
                  <input
                    type="checkbox"
                    id={loc}
                    onChange={(e) => handleCheckboxChange(e, "location")}
                    checked={formData.location.includes(loc)}
                    style={{
                      marginRight: 12,
                      width: 22,
                      height: 22,
                      accentColor: formData.location.includes(loc) ? '#2d9cdb' : '#e0e0e0'
                    }}
                  />
                  {loc.replace(/([A-Z])/g, ' $1')}
                </label>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
            <div className="resource-tabs-bar" style={{
              display: 'flex',
              background: '#f6f6f8',
              borderRadius: 16,
              marginBottom: 32,
              padding: 0,
              justifyContent: 'space-between',
              alignItems: 'center',
              height: 64,
              boxShadow: 'none'
            }}>
              {resourceTabs.map(tab => (
                <button
                  key={tab.key}
                  className={`resource-tab-btn${resourceTab === tab.key ? ' active' : ''}`}
                  style={{
                    flex: 1,
                    background: resourceTab === tab.key ? '#fff' : 'transparent',
                    color: resourceTab === tab.key ? '#222' : '#888',
                    fontWeight: resourceTab === tab.key ? 700 : 600,
                  }}
                  onClick={() => setResourceTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {resourceTab === "assessment" && (
              <>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>Assessment Criteria <span className="required-compact">*</span></div>
                <div style={{ color: '#6c757d', marginBottom: 24 }}>Select the assessment methods for this course</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 24,
                  marginBottom: 32
                }}>
                  {["Theory", "Assignment", "Practical", "Exam", "Lab", "Viva"].map((item) => (
                    <label key={item} style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '18px 24px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: formData.assessmentCriteria.includes(item) ? '0 0 0 2px #2d9cdb' : 'none',
                      transition: 'box-shadow 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        id={item}
                        onChange={(e) => handleCheckboxChange(e, "assessmentCriteria")}
                        checked={formData.assessmentCriteria.includes(item)}
                        style={{
                          marginRight: 12,
                          width: 22,
                          height: 22,
                          accentColor: formData.assessmentCriteria.includes(item) ? '#2d9cdb' : '#e0e0e0'
                        }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </>
            )}
            {resourceTab === "resources" && (
              <>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>Resources <span className="required-compact">*</span></div>
                <div style={{ color: '#6c757d', marginBottom: 24 }}>Select the resources required for this course</div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  marginBottom: 32
                }}>
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '18px 24px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: formData.resources.includes("Vehicle") ? '0 0 0 2px #2d9cdb' : 'none',
                      transition: 'box-shadow 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        id="Vehicle"
                        onChange={(e) => handleCheckboxChange(e, "resources")}
                        checked={formData.resources.includes("Vehicle")}
                        style={{
                          marginRight: 12,
                          width: 22,
                          height: 22,
                          accentColor: formData.resources.includes("Vehicle") ? '#2d9cdb' : '#e0e0e0'
                        }}
                      />
                      Vehicle
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '18px 24px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: formData.resources.includes("Yard") ? '0 0 0 2px #2d9cdb' : 'none',
                      transition: 'box-shadow 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        id="Yard"
                        onChange={(e) => handleCheckboxChange(e, "resources")}
                        checked={formData.resources.includes("Yard")}
                        style={{
                          marginRight: 12,
                          width: 22,
                          height: 22,
                          accentColor: formData.resources.includes("Yard") ? '#2d9cdb' : '#e0e0e0'
                        }}
                      />
                      Yard
                    </label>
                  </div>
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '18px 24px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: formData.resources.includes("Gantry") ? '0 0 0 2px #2d9cdb' : 'none',
                      transition: 'box-shadow 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        id="Gantry"
                        onChange={(e) => handleCheckboxChange(e, "resources")}
                        checked={formData.resources.includes("Gantry")}
                        style={{
                          marginRight: 12,
                          width: 22,
                          height: 22,
                          accentColor: formData.resources.includes("Gantry") ? '#2d9cdb' : '#e0e0e0'
                        }}
                      />
                      Gantry
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '18px 24px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: formData.resources.includes("ShipSimulator") ? '0 0 0 2px #2d9cdb' : 'none',
                      transition: 'box-shadow 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        id="ShipSimulator"
                        onChange={(e) => handleCheckboxChange(e, "resources")}
                        checked={formData.resources.includes("ShipSimulator")}
                        style={{
                          marginRight: 12,
                          width: 22,
                          height: 22,
                          accentColor: formData.resources.includes("ShipSimulator") ? '#2d9cdb' : '#e0e0e0'
                        }}
                      />
                      Ship Simulator
                    </label>
                  </div>
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '18px 24px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: formData.resources.includes("Onboard") ? '0 0 0 2px #2d9cdb' : 'none',
                      transition: 'box-shadow 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        id="Onboard"
                        onChange={(e) => handleCheckboxChange(e, "resources")}
                        checked={formData.resources.includes("Onboard")}
                        style={{
                          marginRight: 12,
                          width: 22,
                          height: 22,
                          accentColor: formData.resources.includes("Onboard") ? '#2d9cdb' : '#e0e0e0'
                        }}
                      />
                      Onboard
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '18px 24px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: formData.resources.includes("SeaTraining") ? '0 0 0 2px #2d9cdb' : 'none',
                      transition: 'box-shadow 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        id="SeaTraining"
                        onChange={(e) => handleCheckboxChange(e, "resources")}
                        checked={formData.resources.includes("SeaTraining")}
                        style={{
                          marginRight: 12,
                          width: 22,
                          height: 22,
                          accentColor: formData.resources.includes("SeaTraining") ? '#2d9cdb' : '#e0e0e0'
                        }}
                      />
                      Sea Training
                    </label>
                  </div>
                </div>
                {/* Base Course Fee input */}
                <div style={{ marginTop: 32 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 8 }}>Base Course Fee <span className="required-compact">*</span></div>
                  <div style={{ color: '#6c757d', marginBottom: 8 }}>This is the base fee for the course. You can configure detailed payment conditions in the next step.</div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      background: '#f7f9fc',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '12px 0 0 12px',
                      padding: '18px 18px',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: '#222',
                      borderRight: 'none'
                    }}>$</span>
                    <input
                      type="text"
                      className={`form-input-compact small-input-compact${errors.fees ? ' error' : ''}`}
                      name="fees"
                      value={formData.fees}
                      onChange={handleInputChange}
                      placeholder="250000"
                      style={{
                        borderRadius: '0 12px 12px 0',
                        borderLeft: 'none',
                        fontSize: '1.1rem',
                        padding: '18px 16px',
                        marginBottom: 0
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 3:
        // Payment step
        return (
          <div className="payment-step-container">
            <div className="payment-header-row">
              <div className="payment-header-title">Payment Conditions - Appendix A</div>
              <div className="payment-header-total">
                <span className="payment-header-total-label">Total Fee</span>
                <span className="payment-header-total-value">
                  ${formData.fees || '0'}
                </span>
              </div>
            </div>
            <div className="payment-header-desc">
              Configure how students will pay for this course. You can set up a registration fee and installment plans.
            </div>
            <div className="payment-form-list">
              {/* Only show Registration Fee input if it's different from fees */}
              {(formData.fees !== formData.registrationFee) && (
                <div className="payment-row">
                  <label className="payment-label">Registration Fee</label>
                  <div className="payment-input-group">
                    <span className="payment-currency">$</span>
                    <input
                      type="number"
                      min="0"
                      className="payment-input"
                      name="registrationFee"
                      value={formData.registrationFee || ""}
                      onChange={e => setFormData(prev => ({ ...prev, registrationFee: e.target.value }))}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              )}
              {installments.map((inst, idx) => (
                <div className="payment-row" key={idx}>
                  <label className="payment-label">
                    <input
                      type="checkbox"
                      checked={inst.enabled}
                      onChange={() => handleInstallmentToggle(idx)}
                      className="payment-checkbox"
                    />
                    {inst.label}
                  </label>
                  <div className="payment-input-group">
                    <span className="payment-currency">$</span>
                    <input
                      type="number"
                      min="0"
                      className="payment-input"
                      value={inst.value}
                      onChange={e => handleInstallmentChange(idx, 'value', e.target.value)}
                      placeholder="Enter amount"
                      disabled={!inst.enabled}
                    />
                    <input
                      type="number"
                      min="0"
                      className="payment-input payment-weeks"
                      value={inst.weeks}
                      onChange={e => handleInstallmentChange(idx, 'weeks', e.target.value)}
                      placeholder="weeks"
                      disabled={!inst.enabled}
                    />
                    <span className="payment-weeks-label">weeks from start date</span>
                    {idx > 1 && (
                      <button
                        type="button"
                        className="payment-remove-btn"
                        onClick={() => removeInstallment(idx)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="payment-add-btn"
                onClick={addInstallment}
              >
                + Add More Installments
              </button>
            </div>
            <div className="payment-remaining-box">
              <span>Remaining Amount:</span>
              <span className={`payment-remaining-amount${getRemainingAmount() === 0 ? ' ok' : ''}`}>
                ${getRemainingAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {errors.installments && (
              <div className="error-message-compact">{errors.installments}</div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`registration-page-container${sidebarCollapsed ? ' expanded' : ''}`}
      style={{
        cursor: isLoading ? 'wait' : 'default',
        marginLeft: sidebarCollapsed ? '90px' : '280px',
        width: sidebarCollapsed ? 'calc(100% - 90px)' : 'calc(100% - 280px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: 'calc(100vh - 60px)',
        background: '#f7f9fc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0'
      }}
    >
      {showPopup && (
        <SuccessPopup
          message={
            courseIdError
              ? courseIdError
              : "Course has been successfully registered!"
          }
          onClose={() => setShowPopup(false)}
        />
      )}

      {showPaymentConditions && (
        <PaymentConditionsPopup
          onClose={() => setShowPaymentConditions(false)}
        />
      )}

      <div
        className="form-container-compact"
        style={{
          width: '100%',
          maxWidth: 700, // Make the container smaller and cuter
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 6px 24px rgba(74,108,250,0.08)',
          padding: '0 0 24px 0',
          margin: '0 auto'
        }}
      >
        <div style={{
          background: 'linear-gradient(90deg, #23395d 0%, #3a6ea5 100%)',
          borderRadius: '16px 16px 0 0',
          padding: '36px 48px 24px 48px',
          marginBottom: 0
        }}>
          <h1 className="payment-main-title" style={{
            margin: 0,
            textAlign: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '2.2rem',
            letterSpacing: '0.5px'
          }}>
            Course & Batch Management
          </h1>
          <div style={{
            color: '#e0e6f0',
            fontSize: '1.1rem',
            marginTop: 12,
            textAlign: 'center',
            fontWeight: 500
          }}>
            Home <span style={{ margin: '0 8px' }}>&gt;</span>
            Course & Batch Management <span style={{ margin: '0 8px' }}>&gt;</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>Course Registration</span>
          </div>
        </div>
        {renderStepper()}
        <form className="form-body-compact" onSubmit={handleNext} style={{ gap: 24, flexDirection: 'column', padding: '0 48px' }}>
          {renderStepContent()}
          <div className="form-footer-compact" style={{
            marginTop: 32,
            justifyContent: 'space-between',
            borderTop: '1.5px solid #e0e0e0',
            paddingTop: 32,
            background: '#fff'
          }}>
            {/* Only show Back button for steps 1 and 2 */}
            {activeStep > 0 && (
              <button
                className="nav-button-compact back-compact"
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                style={{
                  minWidth: 120,
                  background: '#fff',
                  color: '#222',
                  border: '1.5px solid #e0e0e0',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  borderRadius: 12,
                  padding: '14px 32px',
                  boxShadow: 'none'
                }}
              >
                &#8592; Back
              </button>
            )}
            <button
              className="nav-button-compact next-compact"
              type="submit"
              disabled={
                isLoading ||
                (activeStep === 0 && (!!courseIdError || !formData.courseId.trim() || !formData.stream.trim() || !formData.courseName.trim()))
              }
              style={{
                background: activeStep === 3 ? '#22b573' : '#222',
                color: '#fff',
                minWidth: 220,
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: 12,
                padding: '14px 32px',
                boxShadow: 'none'
              }}
            >
              {isLoading
                ? <span className="loading-text">Processing...</span>
                : activeStep === 3 ? 'Submit Registration' : 'Next'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default C_Registration;
