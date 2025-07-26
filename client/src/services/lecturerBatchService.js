import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lecturerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lecturerToken');
      window.location.href = '/lecturer/login';
    }
    return Promise.reject(error);
  }
);

// BATCH MANAGEMENT
export const batchService = {
  // Get all batches for a lecturer
  getLecturerBatches: async (lecturerId, status = null) => {
    try {
      const url = status 
        ? `/lecturer-batches/batches/${lecturerId}?status=${status}`
        : `/lecturer-batches/batches/${lecturerId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching lecturer batches:', error);
      throw error;
    }
  },

  // Get single batch details
  getBatchDetails: async (batchId) => {
    try {
      const response = await api.get(`/lecturer-batches/batch/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch details:', error);
      throw error;
    }
  },

  // Create new batch
  createBatch: async (batchData) => {
    try {
      const response = await api.post('/lecturer-batches/batch', batchData);
      return response.data;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  },

  // Update batch
  updateBatch: async (batchId, batchData) => {
    try {
      const response = await api.put(`/lecturer-batches/batch/${batchId}`, batchData);
      return response.data;
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  },
};

// MATERIALS MANAGEMENT
export const materialsService = {
  // Get batch materials
  getBatchMaterials: async (batchId) => {
    try {
      const response = await api.get(`/lecturer-batches/batch/${batchId}/materials`);
      return response.data;
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  },

  // Upload material
  uploadMaterial: async (batchId, materialData) => {
    try {
      const formData = new FormData();
      formData.append('title', materialData.title);
      formData.append('description', materialData.description);
      formData.append('material_type', materialData.material_type || 'lecture');
      
      if (materialData.file) {
        formData.append('file', materialData.file);
      }

      const response = await api.post(`/lecturer-batches/batch/${batchId}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading material:', error);
      throw error;
    }
  },

  // Delete material
  deleteMaterial: async (materialId) => {
    try {
      const response = await api.delete(`/lecturer-batches/materials/${materialId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  },
};

// ASSIGNMENTS MANAGEMENT
export const assignmentsService = {
  // Get batch assignments
  getBatchAssignments: async (batchId) => {
    try {
      const response = await api.get(`/lecturer-batches/batch/${batchId}/assignments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  // Create assignment
  createAssignment: async (batchId, assignmentData) => {
    try {
      const response = await api.post(`/lecturer-batches/batch/${batchId}/assignments`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  // Update assignment
  updateAssignment: async (assignmentId, assignmentData) => {
    try {
      const response = await api.put(`/lecturer-batches/assignments/${assignmentId}`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  // Get assignment submissions
  getAssignmentSubmissions: async (assignmentId) => {
    try {
      const response = await api.get(`/lecturer-batches/assignments/${assignmentId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

    // Grade assignment (deprecated - use gradeSubmission instead)
  gradeAssignment: async (assignmentId, gradeData) => {
    try {
      const response = await api.post(`/lecturer-batches/assignments/${assignmentId}/grade`, gradeData);
      return response.data;
    } catch (error) {
      console.error('Error grading assignment:', error);
      throw error;
    }
  },

  // Grade submission and provide feedback
  gradeSubmission: async (submissionId, gradeData) => {
    try {
      const response = await api.put(`/lecturer-batches/submissions/${submissionId}/grade`, gradeData);
      return response.data;
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  },

  // Download submission file
  downloadSubmission: async (submissionId) => {
    try {
      const response = await api.get(`/lecturer-batches/submissions/${submissionId}/download`, {
        responseType: 'blob',
        // Ensure headers are included in response
        headers: {
          'Accept': '*/*'
        }
      });
      
      // Get content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Create blob with the correct content type
      const blob = new Blob([response.data], { type: contentType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'submission-download';
      if (contentDisposition) {
        // Handle both encoded and non-encoded filenames
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          // Decode if URL encoded
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // If decoding fails, use the original filename
          }
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error downloading submission:', error);
      throw error;
    }
  },

  // Get assignment statistics
  getAssignmentStats: async (assignmentId) => {
    try {
      const response = await api.get(`/lecturer-batches/assignments/${assignmentId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment statistics:', error);
      throw error;
    }
  },
};

// ANNOUNCEMENTS MANAGEMENT
export const announcementsService = {
  // Get batch announcements
  getBatchAnnouncements: async (batchId) => {
    try {
      const response = await api.get(`/lecturer-batches/batch/${batchId}/announcements`);
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  // Create announcement
  createAnnouncement: async (batchId, announcementData) => {
    try {
      const response = await api.post(`/lecturer-batches/batch/${batchId}/announcements`, announcementData);
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  // Update announcement
  updateAnnouncement: async (announcementId, announcementData) => {
    try {
      const response = await api.put(`/lecturer-batches/announcements/${announcementId}`, announcementData);
      return response.data;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  // Delete announcement
  deleteAnnouncement: async (announcementId) => {
    try {
      const response = await api.delete(`/lecturer-batches/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },
};

// QUIZZES MANAGEMENT
export const quizzesService = {
  // Get batch quizzes
  getBatchQuizzes: async (batchId) => {
    try {
      const response = await api.get(`/lecturer-batches/batch/${batchId}/quizzes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  // Create quiz
  createQuiz: async (batchId, quizData) => {
    try {
      const response = await api.post(`/lecturer-batches/batch/${batchId}/quizzes`, quizData);
      return response.data;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },
};

// Utility functions
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDaysRemaining = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default {
  batchService,
  materialsService,
  assignmentsService,
  announcementsService,
  quizzesService,
  formatFileSize,
  formatDate,
  calculateDaysRemaining,
}; 