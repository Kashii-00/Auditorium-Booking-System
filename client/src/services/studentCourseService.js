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

export const downloadSubmission = async (submissionId) => {
  try {
    const token = localStorage.getItem('studentToken');
    const response = await fetch(`${API_URL}/submissions/${submissionId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download submission');
    }

    // Get filename from response headers
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'submission';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading submission:', error);
    throw error;
  }
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