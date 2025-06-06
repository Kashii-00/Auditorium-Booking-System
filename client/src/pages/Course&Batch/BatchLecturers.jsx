import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authRequest } from '../../services/authService';
import { FaPlus, FaTrash, FaPen, FaArrowLeft, FaExclamationTriangle, FaUserTie, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import './styles/BatchLecturers.css';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const BatchLecturers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lecturerToDelete, setLecturerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentLecturer, setCurrentLecturer] = useState(null);
  const [moduleValue, setModuleValue] = useState('');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false;
  });

  // Add deleteError state
  const [deleteError, setDeleteError] = useState(null);

  // Fetch batch and lecturer data
  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        const batchData = await authRequest('get', `http://localhost:5003/api/batches/${id}`);
        setBatch(batchData);
      } catch (err) {
        console.error('Error fetching batch data:', err);
        setError('Failed to load batch information. Please try again later.');
      }
    };

    const fetchBatchLecturers = async () => {
      try {
        setLoading(true);
        const lecturersData = await authRequest('get', `http://localhost:5003/api/batches/${id}/lecturers`);
        setLecturers(lecturersData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching batch lecturers:', err);
        setError('Failed to load batch lecturers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
    fetchBatchLecturers();
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

  // Handle lecturer removal confirmation
  const confirmDeleteLecturer = (lecturer) => {
    setLecturerToDelete(lecturer);
    setShowDeleteConfirm(true);
  };

  // Delete lecturer from batch
  const handleDeleteLecturer = async () => {
    if (!lecturerToDelete) return;
    
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      
      const response = await authRequest(
        'delete', 
        `http://localhost:5003/api/batches/${id}/lecturers/${lecturerToDelete.id}`
      );
      
      if (response.success) {
        setLecturers(lecturers.filter(l => l.id !== lecturerToDelete.id));
        setSuccessMessage(`Lecturer ${lecturerToDelete.full_name || 'selected'} removed from batch successfully.`);
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error removing lecturer from batch:', err);
      setDeleteError('Failed to remove lecturer from batch. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setLecturerToDelete(null);
    }
  };

  // Handle edit module functionality
  const handleEditModule = (lecturer) => {
    setCurrentLecturer(lecturer);
    setModuleValue(lecturer.module || '');
    setShowEditModal(true);
  };

  // Save module changes
  const saveModuleChanges = async () => {
    if (!currentLecturer) return;
    
    try {
      setLoading(true);
      
      const response = await authRequest(
        'put', 
        `http://localhost:5003/api/batches/${id}/lecturers/${currentLecturer.id}`,
        { module: moduleValue }
      );
      
      if (response.success) {
        // Update the local state to reflect the change
        const updatedLecturers = lecturers.map(l => 
          l.id === currentLecturer.id ? {...l, module: moduleValue} : l
        );
        
        setLecturers(updatedLecturers);
        setSuccessMessage(`Lecturer module updated successfully.`);
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Close the modal
        setShowEditModal(false);
        setCurrentLecturer(null);
      }
    } catch (err) {
      console.error('Error updating lecturer module:', err);
      setError('Failed to update lecturer module. Please try again later.');
    } finally {
      setLoading(false);
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

  // Render loading state
  if (loading && !lecturers.length) {
    return (
      <div className={`batch-lecturers-container ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="loading-message">Loading batch lecturers...</div>
      </div>
    );
  }

  return (
    <div className={`batch-lecturers-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      <div className="batch-lecturers-header">
        <Link to="/BatchRegistration" className="back-link">
          <FaArrowLeft /> Back to Batches
        </Link>
        <h1 className="batch-lecturers-title">
          Batch Lecturers: {batch?.batch_name || 'Loading...'}
        </h1>
        <div className="batch-info">
          <div className="batch-info-item">
            <span className="batch-info-label">Course:</span>
            <span className="batch-info-value">{batch?.courseName || 'Loading...'}</span>
          </div>
          <div className="batch-info-item">
            <span className="batch-info-label">Duration:</span>
            <span className="batch-info-value">
              {formatDate(batch?.start_date)} - {formatDate(batch?.end_date)}
            </span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <FaCheck /> {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      <div className="batch-lecturers-actions">
        <Link to={`/batch/${id}/add-lecturers`} className="add-lecturers-button">
          <FaPlus /> Add Lecturers
        </Link>
      </div>

      <div className="batch-lecturers-content">
        {lecturers.length === 0 ? (
          <div className="no-lecturers-message">
            <FaUserTie className="no-lecturers-icon" />
            <p>No lecturers assigned to this batch yet.</p>
            <p className="hint-text">Assign lecturers to this batch to manage the teaching schedule.</p>
          </div>
        ) : (
          <div className="lecturers-table-container">
            <table className="lecturers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Module</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map(lecturer => (
                  <tr key={lecturer.id}>
                    <td>{lecturer.id}</td>
                    <td>{lecturer.full_name || lecturer.userName || lecturer.name || 'N/A'}</td>
                    <td>{lecturer.email || 'N/A'}</td>
                    <td>{lecturer.category || 'N/A'}</td>
                    <td>{lecturer.module || 'Not specified'}</td>
                    <td className="action-buttons">
                      <Link 
                        to={`/lecturer/${lecturer.lecturer_id}`} 
                        className="view-button"
                        title="View lecturer details"
                      >
                        <FaEye />
                      </Link>
                      <button
                        className="edit-button"
                        onClick={() => handleEditModule(lecturer)}
                        title="Edit lecturer module"
                      >
                        <FaPen />
                      </button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDeleteLecturer(lecturer)}
                        title="Remove lecturer from batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirmation">
          <div className="delete-confirmation-content">
            <FaExclamationTriangle className="warning-icon" />
            <h3>Confirm Removal</h3>
            <p>
              Are you sure you want to remove <strong>{lecturerToDelete?.full_name || 'this lecturer'}</strong> from the batch?
            </p>
            {deleteError && (
              <div className="error-message">
                <FaExclamationTriangle /> {deleteError}
              </div>
            )}
            <div className="confirmation-actions">
              <button 
                className="cancel-button" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={handleDeleteLecturer}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    Removing...
                  </>
                ) : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModal && (
        <div className="edit-module-modal">
          <div className="edit-module-content">
            <h3>Edit Lecturer Module</h3>
            <p>
              <strong>Lecturer:</strong> {currentLecturer?.userName || 'Unknown'}
            </p>
            <div className="form-group">
              <label htmlFor="module">Module:</label>
              <input
                type="text"
                id="module"
                value={moduleValue}
                onChange={(e) => setModuleValue(e.target.value)}
                placeholder="Enter module name"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-button" 
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentLecturer(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-button"
                onClick={saveModuleChanges}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchLecturers;
