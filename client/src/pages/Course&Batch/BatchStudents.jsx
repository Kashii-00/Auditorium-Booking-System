import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaUserGraduate, FaSearch, FaFilter, FaFileExport } from "react-icons/fa";
import { authRequest } from "../../services/authService";
import "./styles/BatchStudents.css";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const BatchStudents = () => {
  const { id: batchId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
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

  // Fetch students in batch
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authRequest("get", `http://localhost:5003/api/batches/${batchId}/students`);
        if (isMounted) setStudents(res);
      } catch (err) {
        if (isMounted) setError("Failed to load students for this batch.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    try {
      fetchStudents();
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [batchId]);

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Remove this student from the batch?")) return;
    try {
      await authRequest("delete", `http://localhost:5003/api/batches/${batchId}/students/${studentId}`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch {
      alert("Failed to remove student from batch.");
    }
  };

  let filteredStudents = [];
  try {
    filteredStudents = students.filter(
      (s) =>
        (filterStatus === 'ALL' || s.status === filterStatus) &&
        (
          s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.id_number?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  } catch (err) {
    filteredStudents = [];
  }

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

  // Export students to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'ID Number', 'Status'];
    const filename = `batch_${batchId}_students.csv`;

    const data = filteredStudents.map(student => [
      student.id,
      student.full_name,
      student.email,
      student.emergency_contact_number,
      student.id_number,
      student.status
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`batch-students-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      <div className="batch-students-header">
        <Link to="/BatchRegistration" className="back-link">
          <FaArrowLeft /> Back to Batches
        </Link>
        <h1 className="batch-students-title">
          {batch?.batch_name || 'Batch'} Students
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
        </div>
      </div>

      <div className="batch-students-toolbar">
        <div className="batch-search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search students by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="batch-toolbar-actions">
          <div className="filter-group">
            <button 
              className="filter-button"
              onClick={() => setShowFilterPopup(!showFilterPopup)}
            >
              <FaFilter /> Filter
            </button>
            
            {showFilterPopup && (
              <div className="filter-popup">
                <div className="filter-section">
                  <h3>Status</h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <button className="export-button" onClick={exportToCSV}>
            <FaFileExport /> Export CSV
          </button>
          
          <Link to={`/batch/${batchId}/add-students`} className="add-students-button">
            <FaPlus /> Add Students
          </Link>
        </div>
      </div>

      <div className="batch-students-content">
        {filteredStudents.length === 0 ? (
          <div className="no-students-message">
            <FaUserGraduate className="no-students-icon" />
            <p>No students found in this batch.</p>
            <Link to={`/batch/${batchId}/add-students`} className="add-students-link">
              Add Students to Batch
            </Link>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>ID Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td>{s.email}</td>
                    <td>{s.id_number}</td>
                    <td>{s.status}</td>
                    <td>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveStudent(s.id)}
                        title="Remove Student"
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
    </div>
  );
};

export default BatchStudents;
