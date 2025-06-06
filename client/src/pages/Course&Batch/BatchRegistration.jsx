import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUserGraduate, FaSearch, FaUserTie } from 'react-icons/fa';
import { authRequest } from '../../services/authService';
import SuccessPopup from './styles/SuccessPopup';
import './styles/BatchRegistration.css';
import { Link } from 'react-router-dom';

const BatchRegistration = () => {
  // State variables
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    course_id: '',
    batch_name: '',
    capacity: 30,
    start_date: '',
    end_date: '',
    location: '',
    schedule: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

  // Effect for sidebar state management
  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) {
        const isCollapsed = stored === 'true';
        setSidebarCollapsed(isCollapsed);
      }
    };

    syncSidebarState();

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

  // Fetch batches data
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const batchesData = await authRequest('get', 'http://localhost:5003/api/batches');
      setBatches(batchesData);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses for dropdown
  const fetchCourses = async () => {
    try {
      const coursesData = await authRequest('get', 'http://localhost:5003/api/CourseRegistrationRoute');
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchBatches();
    fetchCourses();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.course_id) {
      setError('Please select a course');
      return;
    }
    
    if (!formData.batch_name) {
      setError('Batch name is required');
      return;
    }
    
    if (!formData.start_date) {
      setError('Start date is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      if (isEditing) {
        // Update existing batch
        await authRequest('put', `http://localhost:5003/api/batches/${currentBatchId}`, formData);
        setPopupMessage('Batch updated successfully!');
      } else {
        // Create new batch
        await authRequest('post', 'http://localhost:5003/api/batches', formData);
        setPopupMessage('Batch created successfully!');
      }
      
      // Reset form and state
      setFormData({
        course_id: '',
        batch_name: '',
        capacity: 30,
        start_date: '',
        end_date: '',
        location: '',
        schedule: ''
      });
      setIsEditing(false);
      setCurrentBatchId(null);
      setShowForm(false);
      setShowPopup(true);
      
      // Reload batches data
      fetchBatches();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving batch:', error);
      setError(error.response?.data?.error || 'Failed to save batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle batch edit
  const handleEdit = (batch) => {
    setFormData({
      course_id: batch.course_id.toString(),
      batch_name: batch.batch_name,
      capacity: batch.capacity || 30,
      start_date: batch.start_date ? new Date(batch.start_date).toISOString().split('T')[0] : '',
      end_date: batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : '',
      location: batch.location || '',
      schedule: batch.schedule || ''
    });
    setIsEditing(true);
    setCurrentBatchId(batch.id);
    setShowForm(true);
    setError('');
  };

  // Show delete confirmation
  const confirmDelete = (batch) => {
    setBatchToDelete(batch);
    setShowDeleteConfirm(true);
  };

  // Handle batch delete
  const handleDelete = async () => {
    if (!batchToDelete) return;
    
    try {
      await authRequest('delete', `http://localhost:5003/api/batches/${batchToDelete.id}`);
      setPopupMessage('Batch deleted successfully!');
      setShowPopup(true);
      
      // Reload batches data
      fetchBatches();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting batch:', error);
      setError(error.response?.data?.error || 'Failed to delete batch. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setBatchToDelete(null);
    }
  };

  // Filter batches based on search term
  const filteredBatches = batches.filter(batch => 
    batch.batch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.courseId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Calculate batch duration
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Not set';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} days`;
    } else {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      return `${weeks} week${weeks !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
    }
  };

  return (
    <div className={`batch-registration-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      {showPopup && <SuccessPopup message={popupMessage} onClose={() => setShowPopup(false)} />}
      
      <div className="batch-header">
        <h1 className="batch-title">Batch Registration</h1>
        <button 
          className="batch-add-button" 
          onClick={() => {
            setFormData({
              course_id: '',
              batch_name: '',
              capacity: 30,
              start_date: '',
              end_date: '',
              location: '',
              schedule: ''
            });
            setIsEditing(false);
            setCurrentBatchId(null);
            setError('');
            setShowForm(!showForm);
          }}
        >
          <FaPlus /> {showForm ? 'Cancel' : 'New Batch'}
        </button>
      </div>
      
      {showForm && (
        <div className="batch-form-container">
          <h2>{isEditing ? 'Edit Batch' : 'Create New Batch'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="batch-form-group">
              <label htmlFor="course_id">Course *</label>
              <select 
                id="course_id" 
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                disabled={isEditing} // Don't allow changing course when editing
                className={!formData.course_id && error ? 'batch-error' : ''}
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseId} - {course.courseName} ({course.stream})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="batch-form-group">
              <label htmlFor="batch_name">Batch Name *</label>
              <input 
                type="text"
                id="batch_name"
                name="batch_name"
                value={formData.batch_name}
                onChange={handleChange}
                placeholder="e.g., Batch 2023-01"
                className={!formData.batch_name && error ? 'batch-error' : ''}
              />
            </div>

            <div className="batch-form-group">
              <label htmlFor="capacity">Capacity</label>
              <input 
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="100"
              />
            </div>
            
            <div className="batch-form-row">
              <div className="batch-form-group">
                <label htmlFor="start_date">Start Date *</label>
                <input 
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={!formData.start_date && error ? 'batch-error' : ''}
                />
              </div>
              
              <div className="batch-form-group">
                <label htmlFor="end_date">End Date</label>
                <input 
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                />
              </div>
            </div>

            <div className="batch-form-group">
              <label htmlFor="location">Location</label>
              <input 
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Main Campus, Room 101"
              />
            </div>

            <div className="batch-form-group">
              <label htmlFor="schedule">Schedule</label>
              <textarea 
                id="schedule"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                placeholder="e.g., Mon-Fri 9:00 AM - 1:00 PM"
                rows="3"
              />
            </div>
            
            {error && <div className="batch-error-message">{error}</div>}
            
            <div className="batch-form-buttons">
              <button 
                type="button" 
                className="batch-cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="batch-submit-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : isEditing ? 'Update Batch' : 'Create Batch'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="batch-search-container">
        <div className="batch-search-input">
          <FaSearch className="batch-search-icon" />
          <input
            type="text"
            placeholder="Search batches by name or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading && !showForm ? (
        <div className="batch-loading">Loading batches...</div>
      ) : error && !showForm ? (
        <div className="batch-error-message">{error}</div>
      ) : filteredBatches.length === 0 ? (
        <div className="batch-no-data">
          <p>No batches found. Create your first batch using the "New Batch" button.</p>
        </div>
      ) : (
        <div className="batch-grid">
          {filteredBatches.map(batch => (
            <div key={batch.id} className="batch-card">
              <div className="batch-card-header">
                <h3 className="batch-card-title">{batch.batch_name}</h3>
                <div className="batch-card-actions">
                  <button 
                    className="batch-edit-button" 
                    onClick={() => handleEdit(batch)}
                    title="Edit batch"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="batch-delete-button" 
                    onClick={() => confirmDelete(batch)}
                    title="Delete batch"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="batch-card-course">
                <strong>Course:</strong> {batch.courseId} - {batch.courseName}
              </div>
              
              <div className="batch-card-dates">
                <div className="batch-date">
                  <FaCalendarAlt className="batch-date-icon" />
                  <span>
                    <strong>Start:</strong> {formatDate(batch.start_date)}
                  </span>
                </div>
                <div className="batch-date">
                  <FaCalendarAlt className="batch-date-icon" />
                  <span>
                    <strong>End:</strong> {formatDate(batch.end_date)}
                  </span>
                </div>
                <div className="batch-date">
                  <span>
                    <strong>Duration:</strong> {calculateDuration(batch.start_date, batch.end_date)}
                  </span>
                </div>
                <div className="batch-capacity">
                  <span>
                    <strong>Capacity:</strong> {batch.capacity || 30} students
                  </span>
                </div>
                {batch.location && (
                  <div className="batch-location">
                    <span>
                      <strong>Location:</strong> {batch.location}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="batch-stats">
                <div className="batch-stat">
                  <FaUserGraduate className="batch-stat-icon" />
                  <span>{batch.student_count || 0} Students</span>
                </div>
                <div className="batch-stat">
                  <FaUserTie className="batch-stat-icon" />
                  <span>{batch.lecturer_count || 0} Lecturers</span>
                </div>
              </div>
              
              <div className="batch-card-buttons">
                <Link 
                  to={`/batch/${batch.id}/students`}
                  className="batch-manage-button"
                  title="Manage students in this batch"
                >
                  <FaUserGraduate className="batch-button-icon" />
                  <span>Students</span>
                </Link>
                <Link 
                  to={`/batch/${batch.id}/lecturers`}
                  className="batch-manage-button"
                  title="Manage lecturers in this batch"
                >
                  <FaUserTie className="batch-button-icon" />
                  <span>Lecturers</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete <strong>{batchToDelete?.batch_name}</strong>?</p>
            <p className="delete-warning">This action cannot be undone and will remove all student and lecturer assignments.</p>
            
            <div className="confirmation-buttons">
              <button 
                className="cancel-button" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRegistration;
