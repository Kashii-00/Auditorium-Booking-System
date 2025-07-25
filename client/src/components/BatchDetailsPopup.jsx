import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserGraduate, FaUserTie, FaCalendarAlt, FaBook, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { authRequest } from '../services/authService';
import '../styles/BatchDetailsPopup.css';
import '../styles/LoadingIndicators.css';

const BatchDetailsPopup = ({ batchId, onClose }) => {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details, students, lecturers
  
  // Function to fetch batch details
  const fetchBatchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authRequest('get', `http://localhost:5003/api/batches/details/${batchId}`);
      console.log("Batch details received:", response);
      setBatch(response);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      setError('Could not load batch details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);
  
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
      <div className="batch-details-popup">
        <div className="details-popup-content">
          <div className="details-popup-header">
            <h3>Batch Details</h3>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Loading batch details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="batch-details-popup">
        <div className="details-popup-content">
          <div className="details-popup-header">
            <h3>Batch Details</h3>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <p>{error}</p>
            <button className="retry-button" onClick={fetchBatchDetails}>
              <FaRedo /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!batch) {
    return null;
  }
  
  return (
    <div className="batch-details-popup">
      <div className="details-popup-content">
        <div className="details-popup-header">
          <h3>{batch.batch_code}</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="batch-tabs">
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FaBook /> Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <FaUserGraduate /> Students ({batch.students?.length || 0})
          </button>
          <button 
            className={`tab-button ${activeTab === 'lecturers' ? 'active' : ''}`}
            onClick={() => setActiveTab('lecturers')}
          >
            <FaUserTie /> Lecturers ({batch.lecturers?.length || 0})
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'details' && (
            <div className="batch-basic-details">
              <div className="batch-detail-item">
                <span className="detail-label">Course:</span>
                <span className="detail-value">{batch.courseName} ({batch.courseCode})</span>
              </div>
              <div className="batch-detail-item">
                <span className="detail-label">Stream:</span>
                <span className="detail-value">{batch.stream || 'N/A'}</span>
              </div>
              <div className="batch-detail-item">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{formatDate(batch.start_date)}</span>
              </div>
              <div className="batch-detail-item">
                <span className="detail-label">End Date:</span>
                <span className="detail-value">{formatDate(batch.end_date)}</span>
              </div>
              <div className="batch-detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">
                  {Math.ceil(
                    (new Date(batch.end_date) - new Date(batch.start_date)) / 
                    (1000 * 60 * 60 * 24 * 7)
                  )} weeks
                </span>
              </div>
              <div className="batch-detail-item">
                <span className="detail-label">Total Students:</span>
                <span className="detail-value">{batch.studentCount || 0}</span>
              </div>
              <div className="batch-detail-item">
                <span className="detail-label">Total Lecturers:</span>
                <span className="detail-value">{batch.lecturers?.length || 0}</span>
              </div>
            </div>
          )}
          
          {activeTab === 'students' && (
            <div className="batch-students">
              {batch.students && batch.students.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID Number</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Enrollment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.students.map(student => (
                      <tr key={student.id}>
                        <td>{student.full_name}</td>
                        <td>{student.id_number}</td>
                        <td>{student.email}</td>
                        <td className={`status status-${student.status?.toLowerCase() || 'active'}`}>
                          {student.status || 'Active'}
                        </td>
                        <td>{formatDate(student.enrollment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data-message">
                  <FaUserGraduate className="no-data-icon" />
                  <p>No students enrolled in this batch yet.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'lecturers' && (
            <div className="batch-lecturers">
              {batch.lecturers && batch.lecturers.length > 0 ? (
                <div className="lecturer-cards">
                  {batch.lecturers.map(lecturer => (
                    <div key={lecturer.id} className="lecturer-card">
                      <h4>{lecturer.full_name || 'N/A'}</h4>
                      <div className="lecturer-details">
                        <p><strong>Module:</strong> {lecturer.module || 'Not specified'}</p>
                        <p><strong>Email:</strong> {lecturer.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {lecturer.phone || 'N/A'}</p>
                        <p><strong>Category:</strong> {lecturer.category || 'Not specified'}</p>
                        <p><strong>Grade:</strong> {lecturer.grade || 'Not specified'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data-message">
                  <FaUserTie className="no-data-icon" />
                  <p>No lecturers assigned to this batch yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDetailsPopup;
