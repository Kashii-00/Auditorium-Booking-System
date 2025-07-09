import { lecturerAuthRequest } from './lecturerAuthService';

const API_URL = 'http://localhost:5003/api/lecturer-courses';

// Course Management
export const getLecturerCourses = async () => {
  return lecturerAuthRequest('GET', `${API_URL}/my-courses`);
};

// Module Management
export const getCourseModules = async (courseId) => {
  return lecturerAuthRequest('GET', `${API_URL}/courses/${courseId}/modules`);
};

export const createModule = async (courseId, moduleData) => {
  return lecturerAuthRequest('POST', `${API_URL}/courses/${courseId}/modules`, moduleData);
};

export const updateModule = async (moduleId, moduleData) => {
  return lecturerAuthRequest('PUT', `${API_URL}/modules/${moduleId}`, moduleData);
};

export const deleteModule = async (moduleId) => {
  return lecturerAuthRequest('DELETE', `${API_URL}/modules/${moduleId}`);
};

// Material Management
export const getModuleMaterials = async (moduleId) => {
  return lecturerAuthRequest('GET', `${API_URL}/modules/${moduleId}/materials`);
};

export const uploadMaterial = async (moduleId, formData) => {
  return lecturerAuthRequest('POST', `${API_URL}/modules/${moduleId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteMaterial = async (materialId) => {
  return lecturerAuthRequest('DELETE', `${API_URL}/materials/${materialId}`);
};

// Assignment Management
export const getModuleAssignments = async (moduleId) => {
  return lecturerAuthRequest('GET', `${API_URL}/modules/${moduleId}/assignments`);
};

export const createAssignment = async (moduleId, assignmentData) => {
  return lecturerAuthRequest('POST', `${API_URL}/modules/${moduleId}/assignments`, assignmentData);
};

export const updateAssignment = async (assignmentId, assignmentData) => {
  return lecturerAuthRequest('PUT', `${API_URL}/assignments/${assignmentId}`, assignmentData);
};

export const getAssignmentSubmissions = async (assignmentId) => {
  return lecturerAuthRequest('GET', `${API_URL}/assignments/${assignmentId}/submissions`);
};

export const gradeSubmission = async (submissionId, gradeData) => {
  return lecturerAuthRequest('PUT', `${API_URL}/submissions/${submissionId}/grade`, gradeData);
};

// Announcements
export const getCourseAnnouncements = async (courseId) => {
  return lecturerAuthRequest('GET', `${API_URL}/courses/${courseId}/announcements`);
};

export const createAnnouncement = async (courseId, announcementData) => {
  return lecturerAuthRequest('POST', `${API_URL}/courses/${courseId}/announcements`, announcementData);
};

// Attendance
export const markAttendance = async (batchId, attendanceData) => {
  return lecturerAuthRequest('POST', `${API_URL}/batches/${batchId}/attendance`, attendanceData);
};

export const getBatchAttendance = async (batchId, date = null) => {
  const url = date 
    ? `${API_URL}/batches/${batchId}/attendance?date=${date}`
    : `${API_URL}/batches/${batchId}/attendance`;
  return lecturerAuthRequest('GET', url);
};

export const getBatchStudents = async (batchId) => {
  return lecturerAuthRequest('GET', `${API_URL}/batches/${batchId}/students`);
}; 