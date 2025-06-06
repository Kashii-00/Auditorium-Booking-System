import React, { useState, useEffect, useRef } from 'react';
import { authRequest } from '../../services/authService';
import { FaCalendarAlt, FaPrint, FaFileExport, FaChevronLeft, FaChevronRight, FaUserGraduate, FaUserTie, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './styles/AnnualPlan.css';
import BatchDetailsPopup from './BatchDetailsPopup';

const AnnualPlan = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const printRef = useRef(null);
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false;
  });

  // Month names for display
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await authRequest('get', 'http://localhost:5003/api/CourseRegistrationRoute');
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses. Please try again later.');
      }
    };

    fetchCourses();
  }, []);

  // Fetch batches when course or year changes
  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch batches for the selected course and year, including student_count and lecturer_count
        const response = await authRequest(
          "get",
          `http://localhost:5003/api/batches?course_id=${selectedCourse}&year=${selectedYear}`
        );
        // If backend does not include counts, fetch them per batch
        if (Array.isArray(response)) {
          // If response already has student_count and lecturer_count, just set
          if (
            response.length > 0 &&
            typeof response[0].student_count !== "undefined" &&
            typeof response[0].lecturer_count !== "undefined"
          ) {
            setBatches(response);
          } else {
            // Fallback: fetch counts per batch
            const batchesWithCounts = await Promise.all(
              response.map(async (batch) => {
                try {
                  const batchDetails = await authRequest(
                    "get",
                    `http://localhost:5003/api/batches/${batch.id}`
                  );
                  return {
                    ...batch,
                    student_count: batchDetails.student_count || 0,
                    lecturer_count: batchDetails.lecturer_count || 0,
                  };
                } catch {
                  return { ...batch, student_count: 0, lecturer_count: 0 };
                }
              })
            );
            setBatches(batchesWithCounts);
          }
        } else {
          setBatches([]);
        }
      } catch (err) {
        setError("Failed to load batches. Please try again.");
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCourse && selectedYear) {
      fetchBatches();
    }
  }, [selectedCourse, selectedYear]);

  // Sidebar state effect
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
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Handle batch click to show details
  const handleBatchClick = (batch) => {
    setSelectedBatch(batch);
    setShowDetailsPopup(true);
  };

  // Close batch details popup
  const closeDetailsPopup = () => {
    setShowDetailsPopup(false);
    setTimeout(() => setSelectedBatch(null), 300); // Clear after animation ends
  };

  // Change year handlers
  const incrementYear = () => setSelectedYear(year => year + 1);
  const decrementYear = () => setSelectedYear(year => year - 1);
  
  // Replace the react-to-print implementation with a simple function
  const handlePrint = () => {
    window.print();
  };
  
  // Export data as CSV
  const handleExport = () => {
    // Create CSV content
    const headers = ['Batch', 'Start Date', 'End Date', 'Duration', 'Status', 'Students', 'Lecturers'];
    
    const data = batches.map(batch => [
      batch.batch_name,
      formatDate(batch.start_date),
      formatDate(batch.end_date),
      `${getDurationInWeeks(batch.start_date, batch.end_date)} weeks`,
      batch.status || 'Active',
      batch.student_count || 0,
      batch.lecturer_count || 0
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const courseName = courses.find(c => c.id.toString() === selectedCourse)?.courseName || 'Course';
    link.href = url;
    link.setAttribute('download', `${courseName}_AnnualPlan_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate batch duration in weeks
  const getDurationInWeeks = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };
  
  // Calculate batch position and width on the timeline
  const getBatchTimelineStyle = (batch) => {
    if (!batch.start_date || !batch.end_date) return { display: 'none' };
    
    const startDate = new Date(batch.start_date);
    const endDate = new Date(batch.end_date);
    
    // Skip if year doesn't match
    if (startDate.getFullYear() !== parseInt(selectedYear) && endDate.getFullYear() !== parseInt(selectedYear)) {
      return { display: 'none' };
    }
    
    // Calculate start position based on month + day
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();
    
    // Calculate day percentage within the month
    const startDayPercent = startDate.getDate() / new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const endDayPercent = endDate.getDate() / new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    
    const startPercent = ((startMonth + startDayPercent) / 12) * 100;
    const endPercent = ((endMonth + endDayPercent) / 12) * 100;
    
    // Ensure we don't exceed timeline boundaries
    const adjustedStartPercent = Math.max(0, startPercent);
    const adjustedEndPercent = Math.min(100, endPercent);
    const width = adjustedEndPercent - adjustedStartPercent;
    
    return {
      left: `${adjustedStartPercent}%`,
      width: `${width}%`
    };
  };

  // Add a loading state for batch details
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Update the fetchBatchDetails function to use the new endpoint
  const fetchBatchDetails = async (batchId) => {
    setDetailLoading(true);
    setDetailError(null);
    
    try {
      // Use the dedicated details endpoint
      const response = await authRequest(
        'get',
        `http://localhost:5003/api/batches/details/${batchId}`
      );
      
      setSelectedBatch(response);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      setDetailError('Could not load batch details. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className={`annual-plan-container ${sidebarCollapsed ? 'expanded' : ''}`}>
      <h1 className="page-title">Annual Training Plan</h1>
      
      <div className="controls-container">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="course-select">Course:</label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="course-select"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseId} - {course.courseName} ({course.stream})
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group year-selector">
            <button 
              className="year-button prev" 
              onClick={decrementYear}
              aria-label="Previous Year"
            >
              <FaChevronLeft />
            </button>
            <div className="year-display">
              <FaCalendarAlt className="year-icon" />
              <span>{selectedYear}</span>
            </div>
            <button 
              className="year-button next" 
              onClick={incrementYear}
              aria-label="Next Year"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        
        <div className="actions">
          <button className="print-button" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="export-button" onClick={handleExport}>
            <FaFileExport /> Export
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-state">Loading annual plan...</div>
      ) : (
        <div className="annual-plan-content" ref={printRef}>
          <div className="plan-header">
            <div className="plan-title">
              {courses.find(c => c.id.toString() === selectedCourse)?.courseName || 'Course'} - Annual Plan {selectedYear}
            </div>
            <div className="plan-subtitle">
              Total Enrollment: {batches.reduce((sum, batch) => sum + (batch.student_count || 0), 0)} students
            </div>
          </div>
          
          <div className="timeline-container">
            <div className="timeline-header">
              {months.map(month => (
                <div key={month} className="month-header">
                  {month}
                </div>
              ))}
            </div>
            
            <div className="timeline-body">
              {batches.length === 0 ? (
                <div className="no-batches-message">
                  No batches found for the selected course and year.
                </div>
              ) : (
                batches.map(batch => (
                  <div 
                    key={batch.id} 
                    className="batch-timeline-item"
                    style={getBatchTimelineStyle(batch)}
                    onClick={() => handleBatchClick(batch)}
                  >
                    <div className="batch-name">{batch.batch_name}</div>
                    <div className="batch-date">{formatDate(batch.start_date).split(',')[0]} - {formatDate(batch.end_date).split(',')[0]}</div>
                    <div className="batch-stats">
                      <span className="student-count">
                        <FaUserGraduate /> {batch.student_count || 0}
                      </span>
                      <span className="lecturer-count">
                        <FaUserTie /> {batch.lecturer_count || 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Timeline grid lines */}
            <div className="timeline-grid">
              {months.map((month, index) => (
                <div key={month} className="grid-line" style={{ left: `${(index * 100) / 12}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {showDetailsPopup && selectedBatch && (
        <BatchDetailsPopup 
          batchId={selectedBatch.id} 
          onClose={closeDetailsPopup}
        />
      )}
    </div>
  );
};

export default AnnualPlan;
