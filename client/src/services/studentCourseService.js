import { studentAuthRequest } from './studentAuthService';

const API_URL = 'http://localhost:5003/api/student-courses';

// Course Management
export const getStudentCourses = async () => {
  return studentAuthRequest('GET', `${API_URL}/my-courses`);
};

// Module Management
export const getCourseModules = async (courseId) => {
  return studentAuthRequest('GET', `${API_URL}/courses/${courseId}/modules`);
};

export const getModuleMaterials = async (moduleId) => {
  return studentAuthRequest('GET', `${API_URL}/modules/${moduleId}/materials`);
};

export const downloadMaterial = async (materialId) => {
  const token = localStorage.getItem('studentToken');
  window.open(`${API_URL}/materials/${materialId}/download?token=${token}`, '_blank');
};

// Assignment Management
export const getModuleAssignments = async (moduleId) => {
  return studentAuthRequest('GET', `${API_URL}/modules/${moduleId}/assignments`);
};

export const getAssignmentDetails = async (assignmentId) => {
  return studentAuthRequest('GET', `${API_URL}/assignments/${assignmentId}`);
};

export const submitAssignment = async (assignmentId, formData) => {
  return studentAuthRequest('POST', `${API_URL}/assignments/${assignmentId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Announcements
export const getCourseAnnouncements = async (courseId) => {
  return studentAuthRequest('GET', `${API_URL}/courses/${courseId}/announcements`);
};

// Attendance
export const getCourseAttendance = async (courseId) => {
  return studentAuthRequest('GET', `${API_URL}/courses/${courseId}/attendance`);
};

// Progress
export const updateModuleProgress = async (moduleId, progressData) => {
  return studentAuthRequest('POST', `${API_URL}/modules/${moduleId}/progress`, progressData);
}; 