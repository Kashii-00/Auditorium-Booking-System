import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload } from "react-icons/fa";
import './styles/lecturerRegistration.css';

const steps = ['Personal Details', 'Bank Details', 'Academic Details', 'Course & Documents'];

export default function LecturerRegistration() {
  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false;
  });
  const [form, setForm] = useState({
    fullName: '', email: '', nicNumber: '', dob: '', address: '', phone: '', cdcNumber: '', cdcCategory: '', vehicleNumber: '',
    bankName: '', branchName: '', accountNumber: '',
    experience: [{ institution: '', years: '', start: '', end: '', designation: '', nature: '' }],
    highestQualification: '', otherQualifications: '',
    category: '', grade: '', course_id: '', stream: '', module: '',
    nic_file: null, photo_file: null, passbook_file: null, education_certificate_file: null,
    cdc_book_file: null, driving_trainer_license_file: null, other_documents_file: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) setSidebarCollapsed(stored === 'true');
    };
    syncSidebarState();
    window.addEventListener('sidebarToggle', (e) => setSidebarCollapsed(e.detail.isCollapsed));
    window.addEventListener('sidebarHover', (e) => setSidebarCollapsed(!e.detail.isHovered));
    window.addEventListener('popstate', syncSidebarState);
    return () => {
      window.removeEventListener('sidebarToggle', (e) => setSidebarCollapsed(e.detail.isCollapsed));
      window.removeEventListener('sidebarHover', (e) => setSidebarCollapsed(!e.detail.isHovered));
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5003/api/lecturer-registration/courses').then(res => setCourses(res.data));
  }, []);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value
    }));
  };

  const handleExperienceChange = (idx, field, value) => {
    setForm(f => {
      const exp = [...f.experience];
      exp[idx][field] = value;
      return { ...f, experience: exp };
    });
  };

  const addExperienceRow = () => setForm(f => ({
    ...f,
    experience: [...f.experience, { institution: '', years: '', start: '', end: '', designation: '', nature: '' }]
  }));

  const removeExperienceRow = idx => setForm(f => ({
    ...f,
    experience: f.experience.filter((_, i) => i !== idx)
  }));

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Valid email is required";
      if (!form.nicNumber.trim()) newErrors.nicNumber = "NIC number is required";
      if (!form.dob) newErrors.dob = "Date of birth is required";
      if (!form.address.trim()) newErrors.address = "Address is required";
      if (!form.phone.trim() || !/^\d{10,}$/.test(form.phone)) newErrors.phone = "Valid phone number is required";
      if (!form.cdcNumber.trim()) newErrors.cdcNumber = "CDC number is required";
      if (!form.cdcCategory.trim()) newErrors.cdcCategory = "CDC category is required";
      if (!form.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle license number is required";
    }
    if (step === 1) {
      if (!form.bankName.trim()) newErrors.bankName = "Bank name is required";
      if (!form.branchName.trim()) newErrors.branchName = "Branch name is required";
      if (!form.accountNumber.trim()) newErrors.accountNumber = "Account number is required";
    }
    if (step === 2) {
      form.experience.forEach((exp, idx) => {
        if (!exp.institution.trim()) newErrors[`exp_institution_${idx}`] = "Institution is required";
        if (!exp.years.trim()) newErrors[`exp_years_${idx}`] = "Years is required";
        if (!exp.start.trim()) newErrors[`exp_start_${idx}`] = "Start date is required";
        if (!exp.end.trim()) newErrors[`exp_end_${idx}`] = "End date is required";
        if (!exp.designation.trim()) newErrors[`exp_designation_${idx}`] = "Designation is required";
        if (!exp.nature.trim()) newErrors[`exp_nature_${idx}`] = "Nature of work is required";
      });
      if (!form.highestQualification.trim()) newErrors.highestQualification = "Highest qualification is required";
      if (!form.otherQualifications.trim()) newErrors.otherQualifications = "Other qualifications are required";
    }
    if (step === 3) {
      if (!form.category.trim()) newErrors.category = "Category is required";
      if (!form.grade.trim()) newErrors.grade = "Grade is required";
      if (!form.course_id) newErrors.course_id = "Course is required";
      if (!form.stream.trim()) newErrors.stream = "Stream is required";
      if (!form.module.trim()) newErrors.module = "Module is required";
      if (!form.nic_file) newErrors.nic_file = "NIC file is required";
      if (!form.photo_file) newErrors.photo_file = "Photo file is required";
      if (!form.passbook_file) newErrors.passbook_file = "Passbook file is required";
      if (!form.education_certificate_file) newErrors.education_certificate_file = "Education certificate file is required";
      if (!form.cdc_book_file) newErrors.cdc_book_file = "CDC book file is required";
      if (!form.driving_trainer_license_file) newErrors.driving_trainer_license_file = "Driving trainer license file is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateStep()) return;
    setIsLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) data.append(k, JSON.stringify(v));
      else if (v) data.append(k, v);
    });
    const userStr = localStorage.getItem('user');
    let user_id = 1;
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.id) user_id = userObj.id;
      } catch {}
    }
    data.set('user_id', user_id);

    if (!form.course_id) {
      alert('Please select a course.');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:5003/api/lecturer-registration/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Lecturer registered!');
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="lecturer-form-grid">
          <div className="lecturer-form-group">
            <label>Full Name</label>
            <input
              name="fullName"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'input-error' : ''}
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>Email</label>
            <input
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>NIC Number</label>
            <input
              name="nicNumber"
              placeholder="Enter your NIC number"
              value={form.nicNumber}
              onChange={handleChange}
              className={errors.nicNumber ? 'input-error' : ''}
            />
            {errors.nicNumber && <span className="error-text">{errors.nicNumber}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>Date of Birth</label>
            <input
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              className={errors.dob ? 'input-error' : ''}
            />
            {errors.dob && <span className="error-text">{errors.dob}</span>}
          </div>
          <div className="lecturer-form-group full-width">
            <label>Address</label>
            <textarea
              name="address"
              placeholder="Enter your address"
              value={form.address}
              onChange={handleChange}
              className={errors.address ? 'input-error' : ''}
            />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>Phone Number</label>
            <input
              name="phone"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange}
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>CDC Number</label>
            <input
              name="cdcNumber"
              placeholder="Enter CDC number"
              value={form.cdcNumber}
              onChange={handleChange}
              className={errors.cdcNumber ? 'input-error' : ''}
            />
            {errors.cdcNumber && <span className="error-text">{errors.cdcNumber}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>CDC Category</label>
            <input
              name="cdcCategory"
              placeholder="Enter CDC category"
              value={form.cdcCategory}
              onChange={handleChange}
              className={errors.cdcCategory ? 'input-error' : ''}
            />
            {errors.cdcCategory && <span className="error-text">{errors.cdcCategory}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>Vehicle License Number</label>
            <input
              name="vehicleNumber"
              placeholder="Enter vehicle number"
              value={form.vehicleNumber}
              onChange={handleChange}
              className={errors.vehicleNumber ? 'input-error' : ''}
            />
            {errors.vehicleNumber && <span className="error-text">{errors.vehicleNumber}</span>}
          </div>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="lecturer-form-grid">
          <div className="lecturer-form-group">
            <label>Bank Name</label>
            <input
              name="bankName"
              placeholder="Enter bank name"
              value={form.bankName}
              onChange={handleChange}
              className={errors.bankName ? 'input-error' : ''}
            />
            {errors.bankName && <span className="error-text">{errors.bankName}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>Branch Name</label>
            <input
              name="branchName"
              placeholder="Enter branch name"
              value={form.branchName}
              onChange={handleChange}
              className={errors.branchName ? 'input-error' : ''}
            />
            {errors.branchName && <span className="error-text">{errors.branchName}</span>}
          </div>
          <div className="lecturer-form-group">
            <label>Account Number</label>
            <input
              name="accountNumber"
              placeholder="Enter account number"
              value={form.accountNumber}
              onChange={handleChange}
              className={errors.accountNumber ? 'input-error' : ''}
            />
            {errors.accountNumber && <span className="error-text">{errors.accountNumber}</span>}
          </div>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div>
          <h4 style={{ marginBottom: 16 }}>Working Experience</h4>
          {form.experience.map((exp, idx) => (
            <div className="lecturer-form-grid" key={idx}>
              <div className="lecturer-form-group">
                <label>Institution</label>
                <input
                  placeholder="Institution"
                  value={exp.institution}
                  onChange={e => handleExperienceChange(idx, 'institution', e.target.value)}
                  className={errors[`exp_institution_${idx}`] ? 'input-error' : ''}
                />
                {errors[`exp_institution_${idx}`] && <span className="error-text">{errors[`exp_institution_${idx}`]}</span>}
              </div>
              <div className="lecturer-form-group">
                <label>Years</label>
                <input
                  placeholder="Years"
                  value={exp.years}
                  onChange={e => handleExperienceChange(idx, 'years', e.target.value)}
                  className={errors[`exp_years_${idx}`] ? 'input-error' : ''}
                />
                {errors[`exp_years_${idx}`] && <span className="error-text">{errors[`exp_years_${idx}`]}</span>}
              </div>
              <div className="lecturer-form-group">
                <label>Start</label>
                <input
                  placeholder="Start"
                  value={exp.start}
                  onChange={e => handleExperienceChange(idx, 'start', e.target.value)}
                  className={errors[`exp_start_${idx}`] ? 'input-error' : ''}
                />
                {errors[`exp_start_${idx}`] && <span className="error-text">{errors[`exp_start_${idx}`]}</span>}
              </div>
              <div className="lecturer-form-group">
                <label>End</label>
                <input
                  placeholder="End"
                  value={exp.end}
                  onChange={e => handleExperienceChange(idx, 'end', e.target.value)}
                  className={errors[`exp_end_${idx}`] ? 'input-error' : ''}
                />
                {errors[`exp_end_${idx}`] && <span className="error-text">{errors[`exp_end_${idx}`]}</span>}
              </div>
              <div className="lecturer-form-group">
                <label>Designation</label>
                <input
                  placeholder="Designation"
                  value={exp.designation}
                  onChange={e => handleExperienceChange(idx, 'designation', e.target.value)}
                  className={errors[`exp_designation_${idx}`] ? 'input-error' : ''}
                />
                {errors[`exp_designation_${idx}`] && <span className="error-text">{errors[`exp_designation_${idx}`]}</span>}
              </div>
              <div className="lecturer-form-group">
                <label>Nature of Work</label>
                <input
                  placeholder="Nature of Work"
                  value={exp.nature}
                  onChange={e => handleExperienceChange(idx, 'nature', e.target.value)}
                  className={errors[`exp_nature_${idx}`] ? 'input-error' : ''}
                />
                {errors[`exp_nature_${idx}`] && <span className="error-text">{errors[`exp_nature_${idx}`]}</span>}
              </div>
              {form.experience.length > 1 && (
                <div className="lecturer-form-group">
                  <button type="button" className="lecturer-nav-btn back" onClick={() => removeExperienceRow(idx)}>Delete</button>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="lecturer-nav-btn" style={{ marginTop: 8 }} onClick={addExperienceRow}>Add Row</button>
          <div className="lecturer-form-grid">
            <div className="lecturer-form-group">
              <label>Highest Qualification</label>
              <input
                name="highestQualification"
                placeholder="Enter your highest qualification"
                value={form.highestQualification}
                onChange={handleChange}
                className={errors.highestQualification ? 'input-error' : ''}
              />
              {errors.highestQualification && <span className="error-text">{errors.highestQualification}</span>}
            </div>
            <div className="lecturer-form-group">
              <label>Other Qualifications</label>
              <textarea
                name="otherQualifications"
                placeholder="Enter other qualifications"
                value={form.otherQualifications}
                onChange={handleChange}
                className={errors.otherQualifications ? 'input-error' : ''}
              />
              {errors.otherQualifications && <span className="error-text">{errors.otherQualifications}</span>}
            </div>
          </div>
        </div>
      );
    }
    if (step === 3) {
      return (
        <>
          <div className="lecturer-form-grid">
            <div className="lecturer-form-group">
              <label>Category</label>
              <input
                name="category"
                placeholder="Enter category"
                value={form.category}
                onChange={handleChange}
                className={errors.category ? 'input-error' : ''}
              />
              {errors.category && <span className="error-text">{errors.category}</span>}
            </div>
            <div className="lecturer-form-group">
              <label>Grade</label>
              <input
                name="grade"
                placeholder="Select Grade"
                value={form.grade}
                onChange={handleChange}
                className={errors.grade ? 'input-error' : ''}
              />
              {errors.grade && <span className="error-text">{errors.grade}</span>}
            </div>
            <div className="lecturer-form-group">
              <label>Course</label>
              <select
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
                className={errors.course_id ? 'input-error' : ''}
              >
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
              </select>
              {errors.course_id && <span className="error-text">{errors.course_id}</span>}
            </div>
            <div className="lecturer-form-group">
              <label>Stream</label>
              <input
                name="stream"
                placeholder="Stream"
                value={form.stream}
                onChange={handleChange}
                className={errors.stream ? 'input-error' : ''}
              />
              {errors.stream && <span className="error-text">{errors.stream}</span>}
            </div>
            <div className="lecturer-form-group full-width">
              <label>Module</label>
              <input
                name="module"
                placeholder="Enter module"
                value={form.module}
                onChange={handleChange}
                className={errors.module ? 'input-error' : ''}
              />
              {errors.module && <span className="error-text">{errors.module}</span>}
            </div>
          </div>
          <hr style={{ margin: "32px 0 24px 0" }} />
          <div className="lecturer-documents-section">
            <h3 style={{ fontWeight: 700, marginBottom: 24 }}>Required Documents</h3>
            <div className="lecturer-documents-grid">
              <div>
                <label>Upload NIC</label>
                <div className="lecturer-upload-box">
                  <label className="lecturer-upload-label">
                    <FaUpload className="lecturer-upload-icon" />
                    <span>Upload file</span>
                    <input type="file" name="nic_file" onChange={handleChange} />
                  </label>
                  {errors.nic_file && <span className="error-text">{errors.nic_file}</span>}
                </div>
              </div>
              <div>
                <label>Upload Photo</label>
                <div className="lecturer-upload-box">
                  <label className="lecturer-upload-label">
                    <FaUpload className="lecturer-upload-icon" />
                    <span>Upload file</span>
                    <input type="file" name="photo_file" onChange={handleChange} />
                  </label>
                  {errors.photo_file && <span className="error-text">{errors.photo_file}</span>}
                </div>
              </div>
              <div>
                <label>Upload Passbook</label>
                <div className="lecturer-upload-box">
                  <label className="lecturer-upload-label">
                    <FaUpload className="lecturer-upload-icon" />
                    <span>Upload file</span>
                    <input type="file" name="passbook_file" onChange={handleChange} />
                  </label>
                  {errors.passbook_file && <span className="error-text">{errors.passbook_file}</span>}
                </div>
              </div>
              <div>
                <label>Upload Education Certificate</label>
                <div className="lecturer-upload-box">
                  <label className="lecturer-upload-label">
                    <FaUpload className="lecturer-upload-icon" />
                    <span>Upload file</span>
                    <input type="file" name="education_certificate_file" onChange={handleChange} />
                  </label>
                  {errors.education_certificate_file && <span className="error-text">{errors.education_certificate_file}</span>}
                </div>
              </div>
              <div>
                <label>Upload CDC Book</label>
                <div className="lecturer-upload-box">
                  <label className="lecturer-upload-label">
                    <FaUpload className="lecturer-upload-icon" />
                    <span>Upload file</span>
                    <input type="file" name="cdc_book_file" onChange={handleChange} />
                  </label>
                  {errors.cdc_book_file && <span className="error-text">{errors.cdc_book_file}</span>}
                </div>
              </div>
              <div>
                <label>Upload Driving Trainer License</label>
                <div className="lecturer-upload-box">
                  <label className="lecturer-upload-label">
                    <FaUpload className="lecturer-upload-icon" />
                    <span>Upload file</span>
                    <input type="file" name="driving_trainer_license_file" onChange={handleChange} />
                  </label>
                  {errors.driving_trainer_license_file && <span className="error-text">{errors.driving_trainer_license_file}</span>}
                </div>
              </div>
              <div style={{ gridColumn: "1 / 3" }}>
                <label>Upload Other Documents</label>
                <div className="lecturer-upload-box">
                  <label className="lecturer-upload-label">
                    <FaUpload className="lecturer-upload-icon" />
                    <span>Upload file</span>
                    <input type="file" name="other_documents_file" onChange={handleChange} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div
      className={`lecturer-registration-container${sidebarCollapsed ? ' expanded' : ''}${isLoading ? ' waiting' : ''}`}
      style={{ minHeight: '70vh' }}
    >
      <div className="lecturer-registration-header">
        <h2 style={{fontSize:'30px'}} >Lecturer Registration</h2>
      </div>
      <div className="lecturer-stepper">
        {steps.map((s, i) => (
          <button
            type="button"
            key={s}
            className={step === i ? 'active' : ''}
            disabled={step === i}
            onClick={() => setStep(i)}
          >
            {s}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {renderStep()}
        <div className="lecturer-nav-btns">
          {step > 0 && (
            <button type="button" className="lecturer-nav-btn back" onClick={back} disabled={isLoading}>
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button type="button" className="lecturer-nav-btn" onClick={next} disabled={isLoading}>
              Next
            </button>
          ) : (
            <button type="submit" className="lecturer-nav-btn" disabled={isLoading}>
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
