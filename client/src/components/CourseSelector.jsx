import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaTimes, FaCheck, FaChevronDown } from 'react-icons/fa';
import './styles/CourseSelector.css';

const CourseSelector = ({ courses, selectedCourses, onChange, error, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const selectorRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.stream.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle course selection
  const toggleCourse = (courseId) => {
    if (disabled) return;
    
    if (selectedCourses.includes(courseId)) {
      onChange(selectedCourses.filter(id => id !== courseId));
    } else {
      onChange([...selectedCourses, courseId]);
    }
  };

  // Handle removing a course
  const removeCourse = (courseId, e) => {
    e.stopPropagation();
    if (disabled) return;
    
    onChange(selectedCourses.filter(id => id !== courseId));
  };

  // Get course info by ID
  const getCourseInfo = (courseId) => {
    return courses.find(course => course.id === courseId);
  };

  return (
    <div className="course-selector-container">
      <div 
        ref={selectorRef}
        className={`course-selector ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="selected-courses">
          {selectedCourses.length > 0 ? (
            selectedCourses.map(courseId => {
              const course = getCourseInfo(courseId);
              return course ? (
                <div key={courseId} className="selected-course-tag">
                  <span>{course.courseName}</span>
                  {!disabled && (
                    <button
                      type="button"
                      className="remove-course-btn"
                      onClick={(e) => removeCourse(courseId, e)}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ) : null;
            })
          ) : (
            <span className="placeholder">Select courses</span>
          )}
        </div>
        <div className="selector-icon">
          <FaChevronDown />
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isOpen && !disabled && (
        <div className="course-dropdown" ref={dropdownRef}>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="courses-list">
            {filteredCourses.length === 0 ? (
              <div className="no-courses-found">
                No courses found matching "{searchTerm}"
              </div>
            ) : (
              filteredCourses.map(course => (
                <div
                  key={course.id}
                  className={`course-option ${selectedCourses.includes(course.id) ? 'selected' : ''}`}
                  onClick={() => toggleCourse(course.id)}
                >
                  <div className="course-info">
                    <div className="course-name">{course.courseName}</div>
                    <div className="course-details">
                      {course.courseId} • {course.stream}
                    </div>
                  </div>
                  {selectedCourses.includes(course.id) && (
                    <div className="selected-indicator">
                      <FaCheck />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {selectedCourses.length > 0 && (
            <div className="selection-summary">
              {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
