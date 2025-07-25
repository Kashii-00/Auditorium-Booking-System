import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authRequest } from '../../services/authService';
import { FaUser, FaEnvelope, FaIdCard, FaGlobe, FaBirthdayCake, FaMapMarkerAlt,
         FaBuilding, FaShip, FaPhone, FaSwimmer, FaUserTie, FaFileUpload,
         FaArrowRight, FaArrowLeft, FaSave, FaCheckCircle, FaExclamationTriangle,
         FaRedo, FaTimes, FaCaretDown, FaSearch, FaTrash } from 'react-icons/fa';
import './styles/Student_Registration.css';

const StudentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCourseOptions, setShowCourseOptions] = useState(false);
  const [courseFilter, setCourseFilter] = useState('');
  const courseOptionsRef = useRef(null);
  const courseInputRef = useRef(null);
  const [studentNotFound, setStudentNotFound] = useState(false);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false;
  });
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    selected_courses: [],
    identification_type: 'NIC',
    id_number: '',
    nationality: '',
    date_of_birth: '',
    country: '',
    cdc_number: '',
    address: '',
    department: '',
    company: '',
    sea_service: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    is_swimmer: false,
    is_slpa_employee: false,
    designation: '',
    division: '',
    service_no: '',
    section_unit: '',
    nic_document: null,
    passport_document: null,
    photo: null,
    driving_details: {
      driving_license_no: '',
      driving_class: '',
      issue_date: ''
    }
  });
  
  // Keep track of existing document paths
  const [existingDocuments, setExistingDocuments] = useState({
    nic_document_path: null,
    passport_document_path: null,
    photo_path: null
  });
  
  const [errors, setErrors] = useState({});
  
  // Fetch student data by ID
  const fetchStudentData = async () => {
    try {
      setInitialLoading(true);
      setErrorMessage('');
      
      const studentData = await authRequest('get', `http://localhost:5003/api/students/${id}`);
      
      if (!studentData || !studentData.id) {
        setStudentNotFound(true);
        throw new Error('Student not found');
      }
      
      // Parse dates
      const dob = studentData.date_of_birth ? new Date(studentData.date_of_birth).toISOString().split('T')[0] : '';
      
      // Parse driving details
      let drivingDetails = {
        driving_license_no: '',
        driving_class: '',
        issue_date: ''
      };
      
      if (studentData.driving_details) {
        try {
          const parsedDrivingDetails = typeof studentData.driving_details === 'string' 
            ? JSON.parse(studentData.driving_details) 
            : studentData.driving_details;
          
          drivingDetails = {
            ...drivingDetails,
            ...parsedDrivingDetails
          };
          
          // Format date if exists
          if (drivingDetails.issue_date) {
            drivingDetails.issue_date = new Date(drivingDetails.issue_date).toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error parsing driving details:', e);
        }
      }
      
      // Extract course IDs from the courses array
      const courseIds = studentData.courses ? 
        studentData.courses.map(course => course.id) : [];
      
      // Update form data
      setFormData({
        full_name: studentData.full_name || '',
        email: studentData.email || '',
        selected_courses: courseIds,
        identification_type: studentData.identification_type || 'NIC',
        id_number: studentData.id_number || '',
        nationality: studentData.nationality || '',
        date_of_birth: dob,
        country: studentData.country || '',
        cdc_number: studentData.cdc_number || '',
        address: studentData.address || '',
        department: studentData.department || '',
        company: studentData.company || '',
        sea_service: studentData.sea_service || '',
        emergency_contact_name: studentData.emergency_contact_name || '',
        emergency_contact_number: studentData.emergency_contact_number || '',
        is_swimmer: Boolean(studentData.is_swimmer),
        is_slpa_employee: Boolean(studentData.is_slpa_employee),
        designation: studentData.designation || '',
        division: studentData.division || '',
        service_no: studentData.service_no || '',
        section_unit: studentData.section_unit || '',
        driving_details: drivingDetails
      });
      
      // Save existing document paths
      setExistingDocuments({
        nic_document_path: studentData.nic_document_path,
        passport_document_path: studentData.passport_document_path,
        photo_path: studentData.photo_path
      });
      
    } catch (error) {
      console.error('Error fetching student data:', error);
      setErrorMessage(`Failed to load student data: ${error.message}`);
    } finally {
      setInitialLoading(false);
    }
  };
  
  // Fetch courses
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      setErrorMessage('');
      
      const coursesData = await authRequest('get', 'http://localhost:5003/api/students/courses');
      
      if (coursesData && Array.isArray(coursesData)) {
        setCourses(coursesData);
      } else {
        throw new Error('Invalid course data format');
      }
      
    } catch (error) {
      console.error('Error fetching courses:', error);
      setErrorMessage('Failed to load courses. Please try again.');
    } finally {
      setCoursesLoading(false);
    }
  };
  
  // Initial data loading
  useEffect(() => {
    fetchStudentData();
    fetchCourses();
  }, [id]);
  
  // Click outside to close course dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (courseOptionsRef.current && !courseOptionsRef.current.contains(event.target) &&
          courseInputRef.current && !courseInputRef.current.contains(event.target)) {
        setShowCourseOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Sync sidebar state
  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) {
        const isCollapsed = stored === 'true';
        setSidebarCollapsed(isCollapsed);
      }
    };

    syncSidebarState();
    
    const handleSidebarToggle = (e) => setSidebarCollapsed(e.detail.isCollapsed);
    const handleSidebarHover = (e) => setSidebarCollapsed(!e.detail.isHovered);
    
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('sidebarHover', handleSidebarHover);
    window.addEventListener('popstate', syncSidebarState);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('sidebarHover', handleSidebarHover);
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, []);
  
  // Form section definitions for multi-step form
  const formSections = [
    { title: "Basic Info", fields: ["full_name", "email", "identification_type", "id_number", "nationality", "date_of_birth", "country", "address"] },
    { title: "Contact", fields: ["emergency_contact_name", "emergency_contact_number"] },
    { title: "Courses", fields: ["selected_courses"] },
    { title: "Additional", fields: ["is_swimmer", "is_slpa_employee", "company"] },
    { title: "Documents", fields: ["nic_document", "passport_document", "photo"] },
  ];
  
  // Conditional fields when SLPA employee is selected - now includes department, sea_service, cdc_number
  const slpaFields = ["designation", "division", "service_no", "section_unit", "department", "sea_service", "cdc_number"];
  
  // Form validation function - modified for edit mode
  const validateForm = (step) => {
    const newErrors = {};
    
    const fieldsToValidate = formSections[step].fields;
    
    // Add conditional fields if applicable
    if (step === 3 && formData.is_slpa_employee) {
      fieldsToValidate.push(...slpaFields);
    }
    
    // Validate required fields
    fieldsToValidate.forEach(field => {
      if (field === "selected_courses") {
        if (formData.selected_courses.length === 0) {
          newErrors.selected_courses = 'Please select at least one course';
        }
        return;
      }
      
      // Skip validation for files in edit mode - files are optional during update
      if (['nic_document', 'passport_document', 'photo'].includes(field)) {
        return;
      }
      
      // Skip checkbox fields since false is a valid value
      const checkboxFields = ["is_swimmer", "is_slpa_employee"];
      if (checkboxFields.includes(field)) {
        return;
      }
      
      // Skip SLPA-specific fields when SLPA employee is not checked
      const slpaSpecificFields = ["department", "sea_service", "cdc_number"];
      const shouldSkipSlpaField = slpaSpecificFields.includes(field) && !formData.is_slpa_employee;
      
      if (!formData[field] && fieldsToValidate.includes(field) && !shouldSkipSlpaField) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });
    
    // Special validation for email format
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files[0]) {
      setFormData({
        ...formData,
        [name]: files[0]
      });
    }
    else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    }
    else if (name.startsWith('driving_details.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        driving_details: {
          ...formData.driving_details,
          [field]: value
        }
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle course selection
  const handleCourseSelect = (courseId) => {
    if (formData.selected_courses.includes(courseId)) {
      setFormData({
        ...formData,
        selected_courses: formData.selected_courses.filter(id => id !== courseId)
      });
    } else {
      setFormData({
        ...formData,
        selected_courses: [...formData.selected_courses, courseId]
      });
    }
  };
  
  // Remove a selected course
  const removeCourse = (courseId) => {
    setFormData({
      ...formData,
      selected_courses: formData.selected_courses.filter(id => id !== courseId)
    });
  };
  
  // Filter courses based on search input
  const filteredCourses = courses.filter(course => 
    course.courseName.toLowerCase().includes(courseFilter.toLowerCase())
  );
  
  // Handle form submission for update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    if (!validateForm(currentStep)) {
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      const formDataObj = new FormData();
      
      // Append form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'driving_details') {
          formDataObj.append(key, JSON.stringify(value));
        }
        else if (key === 'selected_courses') {
          // Append as JSON string for proper array handling
          formDataObj.append('course_ids', JSON.stringify(value));
        }
        else if (key === 'is_swimmer' || key === 'is_slpa_employee') {
          // Convert boolean to string for proper backend processing
          formDataObj.append(key, value ? 'true' : 'false');
        }
        else if (value instanceof File) {
          // Rename files to match backend expectations
          if (key === 'nic_document') {
            formDataObj.append('nic_document', value);
          } else if (key === 'passport_document') {
            formDataObj.append('passport_document', value);
          } else if (key === 'photo') {
            formDataObj.append('photo', value);
          }
        }
        else if (typeof value !== 'undefined' && value !== null) {
          formDataObj.append(key, value);
        }
      });
      
      // Add primary_course_id field for clarity
      if (formData.selected_courses.length > 0) {
        formDataObj.append('primary_course_id', formData.selected_courses[0]);
      }
      
      // Use PUT method for update
      const response = await authRequest('put', `http://localhost:5003/api/students/${id}`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        setSuccessMessage('Student updated successfully!');
        
        // Navigate back to student list after a short delay
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to update student. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate to previous form step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Navigate to next form step
  const nextStep = () => {
    if (validateForm(currentStep)) {
      if (currentStep < formSections.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  // Go back to student list
  const handleCancel = () => {
    navigate(-1);
  };
  
  // Render the appropriate form fields based on the current step
  const renderFormFields = () => {
    const currentFields = formSections[currentStep].fields;
    
    return (
      <div className="student-form-fields">
        {currentFields.map(field => {
          if (field === 'full_name') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="full_name">
                  <FaUser className="field-icon" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={errors.full_name ? 'error' : ''}
                />
                {errors.full_name && <div className="error-message">{errors.full_name}</div>}
              </div>
            );
          }
          
          if (field === 'email') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="email">
                  <FaEnvelope className="field-icon" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>
            );
          }
          
          if (field === 'identification_type') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="identification_type">
                  <FaIdCard className="field-icon" />
                  Identification Document *
                </label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="identification_type"
                      value="NIC"
                      checked={formData.identification_type === 'NIC'}
                      onChange={handleChange}
                    />
                    <span>NIC</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="identification_type"
                      value="Passport"
                      checked={formData.identification_type === 'Passport'}
                      onChange={handleChange}
                    />
                    <span>Passport</span>
                  </label>
                </div>
                {errors.identification_type && <div className="error-message">{errors.identification_type}</div>}
              </div>
            );
          }
          
          if (field === 'id_number') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="id_number">
                  <FaIdCard className="field-icon" />
                  {formData.identification_type} Number *
                </label>
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder={`Enter ${formData.identification_type} number`}
                  className={errors.id_number ? 'error' : ''}
                />
                {errors.id_number && <div className="error-message">{errors.id_number}</div>}
              </div>
            );
          }
          
          if (field === 'nationality') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="nationality">
                  <FaGlobe className="field-icon" />
                  Nationality *
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="Enter nationality"
                  className={errors.nationality ? 'error' : ''}
                />
                {errors.nationality && <div className="error-message">{errors.nationality}</div>}
              </div>
            );
          }
          
          if (field === 'date_of_birth') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="date_of_birth">
                  <FaBirthdayCake className="field-icon" />
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={errors.date_of_birth ? 'error' : ''}
                />
                {errors.date_of_birth && <div className="error-message">{errors.date_of_birth}</div>}
              </div>
            );
          }
          
          if (field === 'country') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="country">
                  <FaGlobe className="field-icon" />
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  className={errors.country ? 'error' : ''}
                />
                {errors.country && <div className="error-message">{errors.country}</div>}
              </div>
            );
          }
          
          if (field === 'cdc_number') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="cdc_number">
                  <FaIdCard className="field-icon" />
                  CDC Number
                </label>
                <input
                  type="text"
                  id="cdc_number"
                  name="cdc_number"
                  value={formData.cdc_number}
                  onChange={handleChange}
                  placeholder="Enter CDC number (if applicable)"
                  className={errors.cdc_number ? 'error' : ''}
                />
                {errors.cdc_number && <div className="error-message">{errors.cdc_number}</div>}
              </div>
            );
          }
          
          if (field === 'address') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="address">
                  <FaMapMarkerAlt className="field-icon" />
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                  rows="3"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <div className="error-message">{errors.address}</div>}
              </div>
            );
          }
          
          if (field === 'department') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="department">
                  <FaBuilding className="field-icon" />
                  Department/Rank
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department or rank"
                  className={errors.department ? 'error' : ''}
                />
                {errors.department && <div className="error-message">{errors.department}</div>}
              </div>
            );
          }
          
          if (field === 'company') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="company">
                  <FaBuilding className="field-icon" />
                  Company (if employed)
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className={errors.company ? 'error' : ''}
                />
                {errors.company && <div className="error-message">{errors.company}</div>}
              </div>
            );
          }
          
          if (field === 'sea_service') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="sea_service">
                  <FaShip className="field-icon" />
                  Sea Services (Year/Month if applicable)
                </label>
                <input
                  type="text"
                  id="sea_service"
                  name="sea_service"
                  value={formData.sea_service}
                  onChange={handleChange}
                  placeholder="Example: 2Y/6M"
                  className={errors.sea_service ? 'error' : ''}
                />
                {errors.sea_service && <div className="error-message">{errors.sea_service}</div>}
              </div>
            );
          }
          
          if (field === 'emergency_contact_name') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="emergency_contact_name">
                  <FaUser className="field-icon" />
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Enter emergency contact name"
                  className={errors.emergency_contact_name ? 'error' : ''}
                />
                {errors.emergency_contact_name && <div className="error-message">{errors.emergency_contact_name}</div>}
              </div>
            );
          }
          
          if (field === 'emergency_contact_number') {
            return (
              <div key={field} className="form-group">
                <label htmlFor="emergency_contact_number">
                  <FaPhone className="field-icon" />
                  Emergency Contact Number *
                </label>
                <input
                  type="text"
                  id="emergency_contact_number"
                  name="emergency_contact_number"
                  value={formData.emergency_contact_number}
                  onChange={handleChange}
                  placeholder="Enter emergency contact number"
                  className={errors.emergency_contact_number ? 'error' : ''}
                />
                {errors.emergency_contact_number && <div className="error-message">{errors.emergency_contact_number}</div>}
              </div>
            );
          }
          
          if (field === 'is_swimmer') {
            return (
              <div key={field} className="form-group checkbox-group">
                <label htmlFor="is_swimmer">
                  <FaSwimmer className="field-icon" />
                  Swimming Ability
                </label>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="is_swimmer"
                    name="is_swimmer"
                    checked={formData.is_swimmer}
                    onChange={handleChange}
                  />
                  <label htmlFor="is_swimmer" className="checkbox-label">
                    Student can swim
                  </label>
                </div>
              </div>
            );
          }
          
          if (field === 'is_slpa_employee') {
            return (
              <div key={field} className="form-group checkbox-group">
                <label htmlFor="is_slpa_employee">
                  <FaUserTie className="field-icon" />
                  SLPA Employee
                </label>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="is_slpa_employee"
                    name="is_slpa_employee"
                    checked={formData.is_slpa_employee}
                    onChange={handleChange}
                  />
                  <label htmlFor="is_slpa_employee" className="checkbox-label">
                    Student is an SLPA employee
                  </label>
                </div>
              </div>
            );
          }
          
          if (field === 'selected_courses') {
            return (
              <div key={field} className="form-group">
                <div className="form-group-header">
                  <label>
                    <FaBuilding className="field-icon" />
                    Select Courses *
                  </label>
                  {errorMessage && (
                    <div className="course-error">
                      <FaExclamationTriangle className="mr-2" />
                      {errorMessage}
                      <button 
                        type="button" 
                        className="retry-button" 
                        onClick={fetchCourses}
                        disabled={coursesLoading}
                      >
                        <FaRedo /> Retry
                      </button>
                    </div>
                  )}
                </div>
                <div className="courses-multiselect">
                  <div 
                    className={`multiselect-selected ${errors.selected_courses ? 'error' : ''}`}
                    onClick={() => !coursesLoading && setShowCourseOptions(true)}
                    ref={courseInputRef}
                  >
                    {formData.selected_courses.length > 0 ? (
                      formData.selected_courses.map(courseId => {
                        const course = courses.find(c => c.id === courseId);
                        return course ? (
                          <div key={courseId} className="selected-course">
                            {course.courseName}
                            <button 
                              type="button"
                              className="remove-course"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCourse(courseId);
                              }}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : null;
                      })
                    ) : coursesLoading ? (
                      <span>Loading courses...</span>
                    ) : (
                      <input 
                        type="text"
                        className="multiselect-input"
                        placeholder="Click to select courses"
                        readOnly
                      />
                    )}
                    <FaCaretDown style={{ marginLeft: 'auto' }} />
                  </div>
                  {errors.selected_courses && (
                    <div className="error-message">{errors.selected_courses}</div>
                  )}
                  
                  {showCourseOptions && !coursesLoading && (
                    <div className="multiselect-options" ref={courseOptionsRef}>
                      <div style={{padding: '0.5rem', borderBottom: '1px solid #eee'}}>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                          <FaSearch style={{marginRight: '0.5rem', color: '#666'}} />
                          <input
                            type="text"
                            placeholder="Search courses..."
                            value={courseFilter}
                            onChange={e => setCourseFilter(e.target.value)}
                            style={{
                              border: 'none',
                              padding: '0.5rem',
                              width: '100%',
                              outline: 'none'
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                          <div
                            key={course.id}
                            className={`course-option ${formData.selected_courses.includes(course.id) ? 'selected' : ''}`}
                            onClick={() => handleCourseSelect(course.id)}
                          >
                            {course.courseName}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '0.75rem 1rem', color: '#666' }}>
                          No courses found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          if (field === 'nic_document') {
            return (
              <div key={field} className="form-group file-upload">
                <label htmlFor="nic_document">
                  <FaFileUpload className="field-icon" />
                  NIC Document {existingDocuments.nic_document_path ? '(Already Uploaded)' : '*'}
                </label>
                {existingDocuments.nic_document_path && (
                  <div className="existing-document">
                    <span>Current document: {existingDocuments.nic_document_path.split('/').pop()}</span>
                  </div>
                )}
                <div className="file-input-container">
                  <input
                    type="file"
                    id="nic_document"
                    name="nic_document"
                    onChange={handleChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className={errors.nic_document ? 'error' : ''}
                  />
                  <div className="file-input-text">
                    {formData.nic_document ? formData.nic_document.name : 'No file chosen'}
                  </div>
                  <button type="button" className="file-input-button">Choose New File</button>
                </div>
                {errors.nic_document && <div className="error-message">{errors.nic_document}</div>}
              </div>
            );
          }
          
          if (field === 'passport_document') {
            return (
              <div key={field} className="form-group file-upload">
                <label htmlFor="passport_document">
                  <FaFileUpload className="field-icon" />
                  Passport Document {existingDocuments.passport_document_path ? '(Already Uploaded)' : '*'}
                </label>
                {existingDocuments.passport_document_path && (
                  <div className="existing-document">
                    <span>Current document: {existingDocuments.passport_document_path.split('/').pop()}</span>
                  </div>
                )}
                <div className="file-input-container">
                  <input
                    type="file"
                    id="passport_document"
                    name="passport_document"
                    onChange={handleChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className={errors.passport_document ? 'error' : ''}
                  />
                  <div className="file-input-text">
                    {formData.passport_document ? formData.passport_document.name : 'No file chosen'}
                  </div>
                  <button type="button" className="file-input-button">Choose New File</button>
                </div>
                {errors.passport_document && <div className="error-message">{errors.passport_document}</div>}
              </div>
            );
          }
          
          if (field === 'photo') {
            return (
              <div key={field} className="form-group file-upload">
                <label htmlFor="photo">
                  <FaFileUpload className="field-icon" />
                  Photo (Passport Size) {existingDocuments.photo_path ? '(Already Uploaded)' : '*'}
                </label>
                {existingDocuments.photo_path && (
                  <div className="existing-document">
                    <span>Current photo: {existingDocuments.photo_path.split('/').pop()}</span>
                  </div>
                )}
                <div className="file-input-container">
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    onChange={handleChange}
                    accept=".jpg,.jpeg,.png"
                    className={errors.photo ? 'error' : ''}
                  />
                  <div className="file-input-text">
                    {formData.photo ? formData.photo.name : 'No file chosen'}
                  </div>
                  <button type="button" className="file-input-button">Choose New File</button>
                </div>
                {errors.photo && <div className="error-message">{errors.photo}</div>}
              </div>
            );
          }
          
          return null;
        })}
        
        {/* Display SLPA employee details when checkbox is checked */}
        {currentStep === 3 && formData.is_slpa_employee && (
          <div className="slpa-employee-fields">
            <h3 className="section-sub-title">SLPA Employee Details</h3>
            
            <div className="form-group">
              <label htmlFor="designation">
                <FaUserTie className="field-icon" />
                Designation *
              </label>
              <input
                type="text"
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Enter designation"
                className={errors.designation ? 'error' : ''}
              />
              {errors.designation && <div className="error-message">{errors.designation}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="division">
                <FaBuilding className="field-icon" />
                Division *
              </label>
              <input
                type="text"
                id="division"
                name="division"
                value={formData.division}
                onChange={handleChange}
                placeholder="Enter division"
                className={errors.division ? 'error' : ''}
              />
              {errors.division && <div className="error-message">{errors.division}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="service_no">
                <FaIdCard className="field-icon" />
                Service No *
              </label>
              <input
                type="text"
                id="service_no"
                name="service_no"
                value={formData.service_no}
                onChange={handleChange}
                placeholder="Enter service number"
                className={errors.service_no ? 'error' : ''}
              />
              {errors.service_no && <div className="error-message">{errors.service_no}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="section_unit">
                <FaBuilding className="field-icon" />
                Section/Unit *
              </label>
              <input
                type="text"
                id="section_unit"
                name="section_unit"
                value={formData.section_unit}
                onChange={handleChange}
                placeholder="Enter section or unit"
                className={errors.section_unit ? 'error' : ''}
              />
              {errors.section_unit && <div className="error-message">{errors.section_unit}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="department">
                <FaBuilding className="field-icon" />
                Department/Rank *
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Enter department or rank"
                className={errors.department ? 'error' : ''}
              />
              {errors.department && <div className="error-message">{errors.department}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="sea_service">
                <FaShip className="field-icon" />
                Sea Services (Year/Month if applicable) *
              </label>
              <input
                type="text"
                id="sea_service"
                name="sea_service"
                value={formData.sea_service}
                onChange={handleChange}
                placeholder="Example: 2Y/6M"
                className={errors.sea_service ? 'error' : ''}
              />
              {errors.sea_service && <div className="error-message">{errors.sea_service}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="cdc_number">
                <FaIdCard className="field-icon" />
                CDC Number *
              </label>
              <input
                type="text"
                id="cdc_number"
                name="cdc_number"
                value={formData.cdc_number}
                onChange={handleChange}
                placeholder="Enter CDC number (if applicable)"
                className={errors.cdc_number ? 'error' : ''}
              />
              {errors.cdc_number && <div className="error-message">{errors.cdc_number}</div>}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Show loading screen while fetching initial data
  if (initialLoading) {
    return (
      <div className={`student-registration-container ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }
  
  // Show not found message if student doesn't exist
  if (studentNotFound) {
    return (
      <div className={`student-registration-container ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="error-banner">
          <FaExclamationTriangle /> Student not found
        </div>
        <button className="prev-btn" onClick={handleCancel}>
          Back to Students
        </button>
      </div>
    );
  }
  
  return (
    <div className={`student-registration-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}
      
      <h1 className="page-title">Edit Student</h1>
      
      <div className="registration-form-container">
        {/* Progress indicator */}
        <div className="form-progress">
          {formSections.map((section, index) => (
            <div 
              key={index} 
              className={`progress-step ${currentStep === index ? 'active' : ''} ${currentStep > index ? 'completed' : ''}`}
              onClick={() => index < currentStep && setCurrentStep(index)}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-label">{section.title}</div>
            </div>
          ))}
        </div>
        
        <form className="student-registration-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">{formSections[currentStep].title}</h2>
            
            {renderFormFields()}
            
            <div className="form-navigation">
              {currentStep > 0 ? (
                <button 
                  type="button" 
                  className="prev-btn" 
                  onClick={prevStep}
                >
                  <FaArrowLeft /> Previous
                </button>
              ) : (
                <button 
                  type="button" 
                  className="prev-btn" 
                  onClick={handleCancel}
                >
                  <FaArrowLeft /> Cancel
                </button>
              )}
              
              {currentStep < formSections.length - 1 ? (
                <button 
                  type="button" 
                  className="next-btn" 
                  onClick={nextStep}
                >
                  Next <FaArrowRight />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Student'} <FaSave />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEdit;
