import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authRequest } from '../../services/authService';
import { FaPlus, FaSearch, FaEdit, FaEye, FaTrash, FaUserGraduate, FaFilter, FaDownload } from 'react-icons/fa';
import './styles/StudentList.css';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false;
  });

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const studentsData = await authRequest('get', 'http://localhost:5003/api/students');
        
        if (Array.isArray(studentsData)) {
          setStudents(studentsData);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  // Sidebar state handling
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

  // Filter students based on search term and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrolled_courses?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || student.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Show delete confirmation
  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  // Delete student handler
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      const response = await authRequest('delete', `http://localhost:5003/api/students/${studentToDelete.id}`);
      
      if (response.success) {
        setStudents(students.filter(s => s.id !== studentToDelete.id));
        setSuccessMessage(`Student ${studentToDelete.full_name} deleted successfully.`);
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setError('Failed to delete student. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };

  // Export student data as CSV
  const exportToCSV = () => {
    // Generate CSV content
    const headers = ['ID', 'Name', 'Email', 'Identification', 'Courses', 'Status'];
    
    const csvData = filteredStudents.map(student => [
      student.id,
      student.full_name,
      student.email,
      `${student.identification_type}: ${student.id_number}`,
      student.enrolled_courses || 'None',
      student.status
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'students.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`student-list-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      <div className="student-list-header">
        <h1 className="page-title">Student Management</h1>
        <Link to="/student-registration" className="add-student-button">
          <FaPlus /> Register New Student
        </Link>
      </div>
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <div className="student-list-toolbar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, ID or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="toolbar-actions">
          <button 
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filter
          </button>
          
          <button 
            className="export-button"
            onClick={exportToCSV}
          >
            <FaDownload /> Export
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <button
            className="apply-filters-button"
            onClick={() => setShowFilters(false)}
          >
            Apply Filters
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="loading-message">Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="no-students-message">
          <FaUserGraduate className="no-data-icon" />
          <p>No students found matching your search.</p>
          {searchTerm || filterStatus !== 'ALL' ? (
            <button 
              className="clear-filters-button"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
              }}
            >
              Clear Filters
            </button>
          ) : (
            <Link to="/student-registration" className="register-link">
              Register your first student
            </Link>
          )}
        </div>
      ) : (
        <div className="student-table-container">
          <table className="student-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Identification</th>
                <th>Courses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.full_name}</td>
                  <td>{student.email}</td>
                  <td>{student.identification_type}: {student.id_number}</td>
                  <td>
                    <div className="courses-cell">
                      {student.enrolled_courses || 'None'}
                      {student.course_count > 0 && (
                        <span className="course-count">{student.course_count}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${student.status?.toLowerCase()}`}>
                      {student.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link to={`/students/${student.id}`} className="view-button" title="View Student">
                      <FaEye />
                    </Link>
                    <Link to={`/students/${student.id}/edit`} className="edit-button" title="Edit Student">
                      <FaEdit />
                    </Link>
                    <button 
                      className="delete-button" 
                      title="Delete Student"
                      onClick={() => confirmDelete(student)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete <strong>{studentToDelete?.full_name}</strong>?</p>
            <p className="delete-warning">This action cannot be undone and will remove all course enrollments.</p>
            
            <div className="confirmation-buttons">
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
    </div>
  );
};

export default StudentList;
