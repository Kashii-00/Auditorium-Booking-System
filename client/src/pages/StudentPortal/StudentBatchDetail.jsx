import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, Users, BookOpen, FileText, MessageSquare, Calendar, Clock, User, Download, Award, Target, CheckCircle, AlertCircle, TrendingUp, Send, X
} from 'lucide-react';
import StudentSidebar from '../../components/StudentSidebar';
import StudentNotifications from '../../components/StudentNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

const API_URL = "http://localhost:5003/api";

const StudentBatchDetail = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State for different sections
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Loading states
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Assignment submission states
  const [submissionModal, setSubmissionModal] = useState({ open: false, assignment: null, isEditing: false });
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Function to get recent activity
  const getRecentActivity = () => {
    const activities = [];
    
    // Get latest material
    if (materials.length > 0) {
      const latestMaterial = materials.reduce((latest, current) => 
        new Date(current.upload_date || current.created_at) > new Date(latest.upload_date || latest.created_at) ? current : latest
      );
      activities.push({
        type: 'material',
        title: `Material "${latestMaterial.title}" uploaded`,
        date: latestMaterial.upload_date || latestMaterial.created_at,
        color: 'emerald'
      });
    }
    
    // Get latest assignment
    if (assignments.length > 0) {
      const latestAssignment = assignments.reduce((latest, current) => 
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      );
      activities.push({
        type: 'assignment',
        title: `Assignment "${latestAssignment.title}" assigned`,
        date: latestAssignment.created_at,
        color: 'blue'
      });
    }
    
    // Get latest announcement
    if (announcements.length > 0) {
      const latestAnnouncement = announcements.reduce((latest, current) => 
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      );
      activities.push({
        type: 'announcement',
        title: `Announcement "${latestAnnouncement.title}" posted`,
        date: latestAnnouncement.created_at,
        color: 'purple'
      });
    }
    
    // Sort by date (most recent first)
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Function to get relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now - past;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  useEffect(() => {
    if (batch) {
      switch (activeTab) {
        case 'overview':
          // Load all data for overview activity
          fetchMaterials();
          fetchAssignments();
          fetchAnnouncements();
          break;
        case 'materials':
          fetchMaterials();
          break;
        case 'assignments':
          fetchAssignments();
          break;
        case 'announcements':
          fetchAnnouncements();
          break;
        default:
          break;
      }
    }
  }, [activeTab, batch]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch batch details');
      }
      
      const data = await response.json();
      setBatch(data.batch);
      setError(null);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      setError('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/${batchId}/materials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/${batchId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/${batchId}/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleMaterialDownload = async (material) => {
    try {
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/materials/${material.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = material.file_name || material.title;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download material');
      }
    } catch (error) {
      console.error('Error downloading material:', error);
    }
  };

  const handleSubmissionDownload = async (submissionId) => {
    try {
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/submissions/${submissionId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
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
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download submission');
        alert('Failed to download submission');
      }
    } catch (error) {
      console.error('Error downloading submission:', error);
      alert('Error downloading submission');
    }
  };

  const handleAssignmentSubmit = (assignment) => {
    setSubmissionModal({ open: true, assignment, isEditing: false });
    setSubmissionText('');
    setSubmissionFile(null);
  };

  const handleAssignmentEdit = (assignment) => {
    setSubmissionModal({ open: true, assignment, isEditing: true });
    setSubmissionText(assignment.submitted_text || '');
    setSubmissionFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size too large. Maximum 50MB allowed.');
        e.target.value = '';
        return;
      }
      setSubmissionFile(file);
    }
  };

  const submitAssignment = async () => {
    // For new submissions, require file or text
    // For edits, allow submission without new content (keeping existing)
    if (!submissionModal.isEditing && !submissionFile && !submissionText.trim()) {
      alert('Please provide either a file or text submission');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('studentToken');
      
      const formData = new FormData();
      if (submissionFile) {
        formData.append('assignmentFile', submissionFile);
      }
      if (submissionText.trim()) {
        formData.append('submission_text', submissionText);
      }

      let url;
      let method;
      
      if (submissionModal.isEditing) {
        // Editing existing submission
        url = `${API_URL}/student-batches/assignments/${submissionModal.assignment.id}/submit/${submissionModal.assignment.submission_id}`;
        method = 'PUT';
      } else {
        // Creating new submission
        url = `${API_URL}/student-batches/assignments/${submissionModal.assignment.id}/submit`;
        method = 'POST';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(submissionModal.isEditing ? 'Assignment updated successfully!' : 'Assignment submitted successfully!');
        setSubmissionModal({ open: false, assignment: null, isEditing: false });
        setSubmissionText('');
        setSubmissionFile(null);
        // Refresh assignments to show updated status
        fetchAssignments();
      } else {
        alert(data.error || (submissionModal.isEditing ? 'Failed to update assignment' : 'Failed to submit assignment'));
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': 
      case 'active': return 'text-green-600 bg-green-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'past': 
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: Target },
    { id: 'announcements', label: 'Announcements', icon: MessageSquare },
  ];

  // Get student data for sidebar
  const [student, setStudent] = useState(null);
  useEffect(() => {
    const studentData = JSON.parse(localStorage.getItem('studentUser') || '{}');
    setStudent(studentData);
  }, []);

  const handleChangePassword = () => {
    navigate('/student-change-password');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
        {/* Enhanced Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-indigo-500/5"></div>
          </div>
          <div className="relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Student Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">Batch Details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <StudentSidebar
          student={student}
          activeTab="batches"
          onTabChange={(tab) => {
            if (tab === 'batches') {
              navigate('/student-dashboard', { state: { activeTab: 'batches' } });
            }
          }}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
          <div className="min-h-screen pt-20 sm:pt-24 pb-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-blue-600 font-medium">Loading batch details...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
        {/* Enhanced Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-indigo-500/5"></div>
          </div>
          <div className="relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Student Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">Batch Details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <StudentSidebar
          student={student}
          activeTab="batches"
          onTabChange={(tab) => {
            if (tab === 'batches') {
              navigate('/student-dashboard', { state: { activeTab: 'batches' } });
            }
          }}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
          <div className="min-h-screen pt-20 sm:pt-24 pb-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <Button 
                    onClick={() => navigate('/student-dashboard', { state: { activeTab: 'batches' } })}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Batches
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
        {/* Enhanced Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-indigo-500/5"></div>
          </div>
          <div className="relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Student Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">Batch Details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <StudentSidebar
          student={student}
          activeTab="batches"
          onTabChange={(tab) => {
            if (tab === 'batches') {
              navigate('/student-dashboard', { state: { activeTab: 'batches' } });
            }
          }}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
          <div className="min-h-screen pt-20 sm:pt-24 pb-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="text-gray-500 text-6xl mb-4">🚫</div>
                  <p className="text-gray-600 font-medium">Batch not found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-indigo-500/5"></div>
        </div>
        <div className="relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Student Portal
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">{batch.batch_code || batch.batchName}</p>
                </div>
              </div>
              {/* Notifications */}
              <div className="flex items-center">
                <StudentNotifications />
              </div>
            </div>
          </div>
        </div>
      </header>

      <StudentSidebar
        student={student}
        activeTab="batches"
        onTabChange={(tab) => {
          if (tab === 'batches') {
            navigate('/student-dashboard', { state: { activeTab: 'batches' } });
          }
        }}
        onChangePassword={handleChangePassword}
        onSidebarToggle={setSidebarOpen}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
        <div className="min-h-screen pt-20 sm:pt-24 pb-8">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            
            {/* Enhanced Batch Header Card */}
            <Card className="mb-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/student-dashboard', { state: { activeTab: 'batches' } })}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-fit"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Batches
                  </Button>
                </div>

                <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                        {batch.batch_code || batch.batchName}
                      </CardTitle>
                      <Badge className={`${getStatusColor(batch.status)} text-xs px-2 py-1 w-fit`}>
                        {batch.status?.charAt(0).toUpperCase() + batch.status?.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm sm:text-base truncate">{batch.courseName || batch.course_name}</p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(batch.start_date || batch.startDate)} - {formatDate(batch.end_date || batch.endDate)}
                        </span>
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {batch.capacity || 'Unlimited'} Capacity
                      </span>
                    </div>
                  </div>

                  {/* Progress Badge */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:ml-6">
                    <div className="bg-blue-100 text-blue-800 rounded-lg px-3 py-2 text-center min-w-[100px]">
                      <div className="text-lg sm:text-xl font-bold">{batch.attendancePercentage || 0}%</div>
                      <div className="text-xs font-medium">My Attendance</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Main Content with Tabs */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              {/* Tab Navigation - Responsive */}
              <div className="border-b border-gray-200 px-3 sm:px-6 pt-4 sm:pt-6">
                {/* Mobile: Horizontal scroll, Desktop: Centered */}
                <nav className="relative">
                  <div className="flex justify-center">
                    <div className="flex space-x-4 sm:space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide min-w-0 max-w-full">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-1 sm:space-x-2 py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap min-w-0 ${
                              activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </nav>
              </div>

              <CardContent className="p-3 sm:p-6">
                {/* Overview Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 sm:space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 sm:space-y-6"
                    >
                      {/* Top Row: Batch Information and Progress Overview */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                        {/* Batch Information */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-5">
                          <div className="flex items-center mb-2">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Batch Information</h3>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Course details and timeline</div>
                          
                          <div className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">Batch ID</div>
                                <div className="text-sm sm:text-base font-semibold text-gray-900">{batch.id || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">Location</div>
                                <div className="text-sm sm:text-base font-semibold text-gray-900">{batch.location || 'TBD'}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">Start Date</div>
                                <div className="text-sm sm:text-base font-semibold text-gray-900">{formatDate(batch.start_date || batch.startDate)}</div>
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">End Date</div>
                                <div className="text-sm sm:text-base font-semibold text-gray-900">{formatDate(batch.end_date || batch.endDate)}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* My Progress */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 sm:p-5">
                          <div className="flex items-center mb-2">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">My Progress</h3>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Your performance in this batch</div>
                          
                          <div className="space-y-4 sm:space-y-6">
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs sm:text-sm text-gray-500">Attendance</span>
                                <span className="text-xl sm:text-2xl font-bold text-emerald-600">{batch.attendancePercentage || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${batch.attendancePercentage || 0}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2 sm:space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                <div className="flex items-center">
                                  <Award className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" />
                                  <span className="text-xs sm:text-sm text-gray-500">Assignments Submitted</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 ml-5 sm:ml-0">{assignments.length} Available</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                <div className="flex items-center">
                                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" />
                                  <span className="text-xs sm:text-sm text-gray-500">Materials Available</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 ml-5 sm:ml-0">{materials.length} Items</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full Width Recent Activity Section */}
                      <div className="w-full">
                        <div className="flex items-center mb-2">
                          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2" />
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Latest updates from your lecturers</div>
                        
                        <div className="space-y-2">
                          {getRecentActivity().length > 0 ? (
                            getRecentActivity().map((activity, index) => (
                              <div key={index} className={`w-full p-3 rounded-lg border ${
                                activity.color === 'emerald' ? 'bg-emerald-50 border-emerald-100' :
                                activity.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                                'bg-purple-50 border-purple-100'
                              }`}>
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                    activity.color === 'emerald' ? 'bg-emerald-500' :
                                    activity.color === 'blue' ? 'bg-blue-500' :
                                    'bg-purple-500'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">{activity.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{getRelativeTime(activity.date)}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="w-full p-4 sm:p-6 text-center">
                              <div className="text-gray-400 text-base sm:text-lg mb-2">📋</div>
                              <div className="text-gray-500 text-xs sm:text-sm">No recent activity</div>
                              <div className="text-gray-400 text-xs mt-1">New materials and assignments will appear here</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Materials Tab Content */}
                {activeTab === 'materials' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Course Materials</h3>
                      <div className="text-xs sm:text-sm text-gray-500">Download materials shared by your lecturer</div>
                    </div>

                    {loadingMaterials ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-blue-600 font-medium text-sm sm:text-base">Loading materials...</p>
                      </div>
                    ) : materials.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No materials available yet</p>
                        <p className="text-gray-400 mt-1 text-sm">Your lecturer will upload course materials here</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {materials.map((material) => (
                          <motion.div 
                            key={material.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group"
                          >
                            {/* Material Type Icon */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                                  {material.file_type?.includes('pdf') ? (
                                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                  ) : material.file_type?.includes('image') ? (
                                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16L12.5,13.5L11,15L7.5,11.5L6,13V18H15Z" />
                                    </svg>
                                  ) : (
                                    <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors text-sm sm:text-base truncate">{material.title}</h4>
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                    material.material_type === 'lecture' ? 'bg-blue-100 text-blue-800' :
                                    material.material_type === 'assignment' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {material.material_type || 'material'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="mb-4">
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">{material.description}</p>
                              
                              {/* File Info */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(material.upload_date || material.created_at)}
                                </div>
                                <div className="flex items-center">
                                  {material.file_size && (
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                      {formatFileSize(material.file_size)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-3 border-t border-gray-200">
                              <Button 
                                onClick={() => handleMaterialDownload(material)}
                                className="w-full flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs sm:text-sm"
                                title="Download Material"
                              >
                                <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Assignments</h3>
                      <div className="text-xs sm:text-sm text-gray-500">View assignments and due dates</div>
                    </div>

                    {loadingAssignments ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-blue-600 font-medium text-sm sm:text-base">Loading assignments...</p>
                      </div>
                    ) : assignments.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <Target className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No assignments available yet</p>
                        <p className="text-gray-400 mt-1 text-sm">Your lecturer will post assignments here</p>
                      </div>
                    ) : (
                      <div className="space-y-4 sm:space-y-6">
                        {assignments.map((assignment) => (
                          <motion.div 
                            key={assignment.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                              <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                                {/* Assignment Icon */}
                                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 flex-shrink-0">
                                  <Target className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base truncate">{assignment.title}</h4>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${
                                      assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                                      assignment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {assignment.status || 'Available'}
                                    </span>
                                  </div>
                                  <p className="text-gray-600 mb-3 line-clamp-2 text-xs sm:text-sm">{assignment.description}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <div className="flex items-center text-gray-500">
                                      <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-blue-500 flex-shrink-0" />
                                      <span className="truncate">Due: {formatDate(assignment.due_date)}</span>
                                    </div>
                                    <div className="flex items-center text-gray-500">
                                      <Target className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-green-500 flex-shrink-0" />
                                      <span>
                                        {assignment.grade !== null && assignment.grade !== undefined ? (
                                          <span className="text-blue-600 font-medium">
                                            {assignment.grade}/{assignment.max_marks || assignment.max_points}
                                          </span>
                                        ) : assignment.submission_status === 'submitted' ? (
                                          <span className="text-amber-600">
                                            Not graded ({assignment.max_marks || assignment.max_points} points)
                                          </span>
                                        ) : (
                                          <span>
                                            {assignment.max_marks || assignment.max_points} points
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-gray-500">
                                      <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-orange-500 flex-shrink-0" />
                                      <span>Created: {formatDate(assignment.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Due Date Status and Submission */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 gap-3 sm:gap-4">
                              <div className="text-xs sm:text-sm text-gray-500">
                                Posted {formatDate(assignment.created_at)}
                              </div>
                              
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                {/* Due Date Status */}
                                <div className="flex items-center justify-center sm:justify-start">
                                  {calculateDaysRemaining(assignment.due_date) > 0 ? (
                                    <span className="flex items-center text-xs sm:text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {calculateDaysRemaining(assignment.due_date)} days left
                                    </span>
                                  ) : calculateDaysRemaining(assignment.due_date) === 0 ? (
                                    <span className="flex items-center text-xs sm:text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Due today
                                    </span>
                                  ) : (
                                    <span className="flex items-center text-xs sm:text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Overdue
                                    </span>
                                  )}
                                </div>

                                {/* Submission Status and Button */}
                                {assignment.submission_status === 'submitted' ? (
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="flex items-center text-xs sm:text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Submitted
                                    </span>
                                    {assignment.submission_date && (
                                      <span className="text-xs text-gray-500">
                                        on {formatDate(assignment.submission_date)}
                                      </span>
                                    )}
                                    {/* Show edit button if still editable (before deadline) */}
                                    {assignment.edit_status === 'editable' && calculateDaysRemaining(assignment.due_date) >= 0 && (
                                      <Button
                                        onClick={() => handleAssignmentEdit(assignment)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors"
                                      >
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                        </svg>
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                ) : calculateDaysRemaining(assignment.due_date) >= 0 ? (
                                  <Button
                                    onClick={() => handleAssignmentSubmit(assignment)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors"
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Submit
                                  </Button>
                                ) : (
                                  <span className="flex items-center text-xs sm:text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                    <X className="w-3 h-3 mr-1" />
                                    Submission Closed
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Announcements Tab */}
                {activeTab === 'announcements' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Announcements</h3>
                      <div className="text-xs sm:text-sm text-gray-500">Important updates from your lecturer</div>
                    </div>

                    {loadingAnnouncements ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-blue-600 font-medium text-sm sm:text-base">Loading announcements...</p>
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <MessageSquare className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No announcements posted yet</p>
                        <p className="text-gray-400 mt-1 text-sm">Your lecturer will post important updates here</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {announcements.map((announcement) => (
                          <div key={announcement.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{announcement.title}</h4>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${getPriorityColor(announcement.priority)}`}>
                                    {announcement.priority}
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-3 text-xs sm:text-sm">{announcement.content}</p>
                                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                                  Posted {formatDate(announcement.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assignment Submission Modal */}
      {submissionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {submissionModal.isEditing ? 'Edit Assignment Submission' : 'Submit Assignment'}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setSubmissionModal({ open: false, assignment: null, isEditing: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {submissionModal.assignment && (
                <div className="space-y-4">
                  {/* Assignment Details */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">{submissionModal.assignment.title}</h4>
                    <p className="text-blue-700 text-sm mb-3">{submissionModal.assignment.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center text-blue-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {formatDate(submissionModal.assignment.due_date)}
                      </span>
                      <span className="flex items-center text-blue-600">
                        <Target className="w-4 h-4 mr-1" />
                        {submissionModal.assignment.max_marks} points
                      </span>
                      <span className="flex items-center text-blue-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {calculateDaysRemaining(submissionModal.assignment.due_date)} days remaining
                      </span>
                    </div>
                  </div>

                  {/* Submission Form */}
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {submissionModal.isEditing ? 'Update Assignment File (Optional)' : 'Upload Assignment File'}
                      </label>
                      
                      {/* Show existing file if editing */}
                      {submissionModal.isEditing && submissionModal.assignment.submitted_file_name && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-blue-700">
                                <strong>Current file:</strong> {submissionModal.assignment.submitted_file_name}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                Upload a new file to replace the current one, or leave empty to keep the current file.
                              </p>
                            </div>
                            {submissionModal.assignment.submission_id && (
                              <Button
                                type="button"
                                onClick={() => handleSubmissionDownload(submissionModal.assignment.submission_id)}
                                className="ml-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md flex items-center"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip,.rar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PDF, DOC, DOCX, TXT, PNG, JPG, ZIP, RAR (Max: 50MB)
                      </p>
                      {submissionFile && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">
                            <strong>New file selected:</strong> {submissionFile.name} ({(submissionFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Optional Text Submission */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Comments (Optional)
                      </label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add any comments or explanations for your submission..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You can add comments, explanations, or notes about your file submission.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={submitAssignment}
                      disabled={submitting || (!submissionModal.isEditing && !submissionFile && !submissionText.trim())}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          {submissionModal.isEditing ? 'Updating...' : 'Submitting...'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Send className="w-4 h-4 mr-2" />
                          {submissionModal.isEditing ? 'Update Submission' : 'Submit Assignment'}
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSubmissionModal({ open: false, assignment: null, isEditing: false })}
                      disabled={submitting}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBatchDetail; 