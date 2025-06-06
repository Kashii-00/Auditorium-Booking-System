import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaPlus, FaUserGraduate } from 'react-icons/fa';
import { authRequest } from '../../services/authService';
import './styles/BatchAddStudents.css';
import SuccessPopup from './styles/SuccessPopup';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BatchAddStudents = () => {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false;
  });

  // Sidebar state management
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

  // Fetch batch details
  const fetchBatch = useCallback(async () => {
    try {
      const batchData = await authRequest('get', `http://localhost:5003/api/batches/${id}`);
      setBatch(batchData);
    } catch (err) {
      console.error('Error fetching batch data:', err);
      setError('Failed to load batch information. Please try again later.');
    }
  }, [id]);

  // Fetch students not in this batch and enrolled in the course
  const fetchAvailableStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // Get all students
      const allStudents = await authRequest("get", "http://localhost:5003/api/students");
      // Get students already assigned to this batch
      const assigned = await authRequest("get", `http://localhost:5003/api/batches/${id}/students`);
      const assignedIds = assigned.map(s => s.id);

      // Defensive: batch may not be loaded yet
      if (!batch || !batch.course_id) {
        setStudents([]);
        setError("Batch course information not loaded. Please try again.");
        return;
      }

      // Filter: only those with the course and not already assigned
      const filtered = allStudents.filter(s => {
        if (Array.isArray(s.courses)) {
          return s.courses.some(c => Number(c.id) === Number(batch.course_id)) && !assignedIds.includes(s.id);
        }
        if (typeof s.enrolled_courses === "string" && s.enrolled_courses.length > 0) {
          return s.enrolled_courses.split(",").map(n => n.trim()).includes(batch.courseName) && !assignedIds.includes(s.id);
        }
        return false;
      });
      setStudents(filtered);
      setError(null);
    } catch (err) {
      console.error('Error fetching available students:', err);
      setError('Failed to load available students. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id, batch]);

  // Initial data loading
  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  useEffect(() => {
    if (batch && batch.course_id) {
      fetchAvailableStudents();
    }
  }, [batch, fetchAvailableStudents]);

  // Filter students based on search
  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
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

  // Add selected students to batch
  const addStudentsToBatch = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student to add to the batch');
      return;
    }
    // Prevent adding more than batch capacity
    const assignedCount = batch?.student_count || 0;
    const capacity = batch?.capacity || 0;
    if (assignedCount + selectedStudents.length > capacity) {
      setError(`Batch capacity reached. You can only add ${capacity - assignedCount} more student(s).`);
      return;
    }

    try {
      setLoading(true);
      await authRequest("post", `http://localhost:5003/api/batches/${id}/students`, {
        student_ids: selectedStudents,
      });
      setSuccessMessage(`Successfully added ${selectedStudents.length} student(s) to the batch`);
      setShowSuccessPopup(true);
      setSelectedStudents([]);
      fetchAvailableStudents();
      // Optionally, refresh batch info to update student_count
      fetchBatch();
    } catch (err) {
      console.error('Error adding students to batch:', err);
      setError('Failed to add students to batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !students.length) {
    return (
      <div className={`batch-add-students-container ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="loading-message">Loading available students...</div>
      </div>
    );
  }

  return (
    <div className={`batch-add-students-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      {showSuccessPopup && (
        <SuccessPopup 
          message={successMessage} 
          onClose={() => setShowSuccessPopup(false)} 
        />
      )}

      <div className="batch-students-header">
        <Link to={`/batch/${id}/students`} className="back-link">
          <FaArrowLeft /> Back to Students List
        </Link>
        <h1 className="batch-students-title">
          Add Students to {batch?.batch_name || 'Batch'}
        </h1>
        <div className="batch-info">
          <div className="batch-info-item">
            <span className="batch-info-label">Course:</span>
            <span className="batch-info-value">{batch?.courseName}</span>
          </div>
          <div className="batch-info-item">
            <span className="batch-info-label">Duration:</span>
            <span className="batch-info-value">
              {formatDate(batch?.start_date)} - {formatDate(batch?.end_date)}
            </span>
          </div>
          <div className="batch-info-item">
            <span className="batch-info-label">Capacity:</span>
            <span className="batch-info-value">
              {batch?.student_count || 0} / {batch?.capacity || 0} students
            </span>
          </div>
        </div>
      </div>

      <div className="batch-students-toolbar">
        <div className="batch-search-box">
          <FaSearch className="search-icon" />
          <Input
            placeholder="Search students by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
        </div>
        
        <Button 
          className="add-to-batch-button"
          onClick={addStudentsToBatch}
          disabled={
            selectedStudents.length === 0 ||
            loading ||
            (batch && batch.student_count + selectedStudents.length > batch.capacity)
          }
        >
          <FaPlus /> Add Selected Students ({selectedStudents.length})
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="batch-students-content">
        {filteredStudents.length === 0 ? (
          <div className="no-students-message">
            <FaUserGraduate className="no-students-icon" />
            <p>
              {error
                ? error
                : "No available students found for this batch."}
            </p>
            <p className="hint-text">
              All registered students may already be enrolled in this batch or you need to register new students first.
            </p>
            <Link to="/student-registration" className="register-student-link">
              Register New Student
            </Link>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>ID Number</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr 
                    key={student.id}
                    className={selectedStudents.includes(student.id) ? 'selected' : ''}
                    onClick={() => toggleStudentSelection(student.id)}
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => {}} // Controlled by the row click
                        onClick={(e) => e.stopPropagation()} // Prevent duplicate toggle
                      />
                    </td>
                    <td>{student.id}</td>
                    <td>{student.full_name}</td>
                    <td>{student.email}</td>
                    <td>{student.emergency_contact_number}</td>
                    <td>{student.id_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchAddStudents;
