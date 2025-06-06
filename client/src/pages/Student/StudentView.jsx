import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authRequest } from '../../services/authService';
import { FaUser, FaEnvelope, FaIdCard, FaGlobe, FaBirthdayCake, FaMapMarkerAlt,
         FaBuilding, FaShip, FaPhone, FaSwimmer, FaUserTie, FaFileUpload,
         FaArrowLeft, FaPen, FaTrash, FaCheckCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './styles/StudentView.css';

const StudentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false;
  });

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const studentData = await authRequest('get', `http://localhost:5003/api/students/${id}`);
        
        if (!studentData || !studentData.id) {
          throw new Error('Student not found');
        }
        
        setStudent(studentData);
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError(`Failed to load student data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [id]);

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

  // Handle student deletion
  const handleDeleteStudent = async () => {
    try {
      setDeleteLoading(true);
      
      await authRequest('delete', `http://localhost:5003/api/students/${id}`);
      
      setSuccessMessage('Student deleted successfully!');
      
      // Navigate back to student list after a short delay
      setTimeout(() => {
        navigate('/student-registration');
      }, 2000);
    } catch (error) {
      console.error('Error deleting student:', error);
      setError(`Failed to delete student: ${error.message}`);
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`student-view-container ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="loading-message">Loading student data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`student-view-container ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="error-banner">
          <FaExclamationTriangle /> {error}
        </div>
        <button className="back-button" onClick={() => navigate('/student-registration')}>
          <FaArrowLeft /> Back to Students
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className={`student-view-container ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="error-banner">
          <FaExclamationTriangle /> Student not found
        </div>
        <button className="back-button" onClick={() => navigate('/student-registration')}>
          <FaArrowLeft /> Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className={`student-view-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}
      
      <div className="student-view-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/student-registration')}>
            <FaArrowLeft /> Back
          </button>
          <h1 className="page-title">{student.full_name}</h1>
        </div>
        
        <div className="header-actions">
          <Link to={`/students/${student.id}/edit`} className="edit-button">
            <FaPen /> Edit
          </Link>
          <button 
            className="delete-button"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
      
      {showDeleteConfirm && (
        <div className="delete-confirmation">
          <div className="delete-confirmation-content">
            <FaExclamationTriangle className="warning-icon" />
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete <strong>{student.full_name}</strong>? This action cannot be undone.</p>
            <div className="confirmation-actions">
              <button 
                className="cancel-button" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={handleDeleteStudent}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="student-info-container">
        <div className="student-info-section">
          <h2 className="section-title">Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <FaUser className="info-icon" /> Full Name
              </div>
              <div className="info-value">{student.full_name}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaEnvelope className="info-icon" /> Email
              </div>
              <div className="info-value">{student.email}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaIdCard className="info-icon" /> {student.identification_type}
              </div>
              <div className="info-value">{student.id_number}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaGlobe className="info-icon" /> Nationality
              </div>
              <div className="info-value">{student.nationality}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaBirthdayCake className="info-icon" /> Date of Birth
              </div>
              <div className="info-value">{formatDate(student.date_of_birth)}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaGlobe className="info-icon" /> Country
              </div>
              <div className="info-value">{student.country || 'Not specified'}</div>
            </div>
          </div>
        </div>
        
        <div className="student-info-section">
          <h2 className="section-title">Contact Information</h2>
          <div className="info-grid">
            <div className="info-item full-width">
              <div className="info-label">
                <FaMapMarkerAlt className="info-icon" /> Address
              </div>
              <div className="info-value">{student.address}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaUser className="info-icon" /> Emergency Contact
              </div>
              <div className="info-value">{student.emergency_contact_name}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaPhone className="info-icon" /> Emergency Phone
              </div>
              <div className="info-value">{student.emergency_contact_number}</div>
            </div>
          </div>
        </div>
        
        <div className="student-info-section">
          <h2 className="section-title">Course Information</h2>
          <div className="courses-container">
            {student.courses && student.courses.length > 0 ? (
              student.courses.map(course => (
                <div key={course.id} className="course-item">
                  <div className="course-name">{course.courseName}</div>
                  <div className="course-id">{course.courseId}</div>
                  {course.course_type === 'primary' && (
                    <div className="course-primary-badge">Primary</div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-courses">No courses assigned</div>
            )}
          </div>
        </div>
        
        <div className="student-info-section">
          <h2 className="section-title">Additional Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <FaBuilding className="info-icon" /> Department/Rank
              </div>
              <div className="info-value">{student.department || 'Not specified'}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaBuilding className="info-icon" /> Company
              </div>
              <div className="info-value">{student.company || 'Not specified'}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaShip className="info-icon" /> Sea Service
              </div>
              <div className="info-value">{student.sea_service || 'Not specified'}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaIdCard className="info-icon" /> CDC Number
              </div>
              <div className="info-value">{student.cdc_number || 'Not specified'}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaSwimmer className="info-icon" /> Swimming Ability
              </div>
              <div className="info-value">
                {student.is_swimmer ? 
                  <span className="positive-value"><FaCheckCircle /> Can swim</span> : 
                  <span className="negative-value"><FaTimes /> Cannot swim</span>}
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">
                <FaUserTie className="info-icon" /> SLPA Employee
              </div>
              <div className="info-value">
                {student.is_slpa_employee ? 
                  <span className="positive-value"><FaCheckCircle /> Yes</span> : 
                  <span className="negative-value"><FaTimes /> No</span>}
              </div>
            </div>
          </div>
        </div>
        
        {student.is_slpa_employee && (
          <div className="student-info-section">
            <h2 className="section-title">SLPA Employee Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <FaUserTie className="info-icon" /> Designation
                </div>
                <div className="info-value">{student.designation || 'Not specified'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FaBuilding className="info-icon" /> Division
                </div>
                <div className="info-value">{student.division || 'Not specified'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FaIdCard className="info-icon" /> Service No
                </div>
                <div className="info-value">{student.service_no || 'Not specified'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <FaBuilding className="info-icon" /> Section/Unit
                </div>
                <div className="info-value">{student.section_unit || 'Not specified'}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="student-info-section">
          <h2 className="section-title">Documents</h2>
          <div className="documents-container">
            {student.nic_document_path && (
              <div className="document-item">
                <div className="document-icon">
                  <FaFileUpload className="info-icon" />
                </div>
                <div className="document-details">
                  <div className="document-name">NIC Document</div>
                  <a 
                    href={`http://localhost:5003/${student.nic_document_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="document-link"
                  >
                    View Document
                  </a>
                </div>
              </div>
            )}
            
            {student.passport_document_path && (
              <div className="document-item">
                <div className="document-icon">
                  <FaFileUpload className="info-icon" />
                </div>
                <div className="document-details">
                  <div className="document-name">Passport Document</div>
                  <a 
                    href={`http://localhost:5003/${student.passport_document_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="document-link"
                  >
                    View Document
                  </a>
                </div>
              </div>
            )}
            
            {student.photo_path && (
              <div className="document-item">
                <div className="document-icon">
                  <FaFileUpload className="info-icon" />
                </div>
                <div className="document-details">
                  <div className="document-name">Photo</div>
                  <a 
                    href={`http://localhost:5003/${student.photo_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="document-link"
                  >
                    View Photo
                  </a>
                </div>
              </div>
            )}
            
            {!student.nic_document_path && !student.passport_document_path && !student.photo_path && (
              <div className="no-documents">No documents uploaded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
