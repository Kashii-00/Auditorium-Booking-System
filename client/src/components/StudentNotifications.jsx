import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Calendar, AlertCircle, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = "http://localhost:5003/api";

const StudentNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingRead, setMarkingRead] = useState({});
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch announcements on mount and when opened
  useEffect(() => {
    fetchAnnouncements();
    
    // Poll for new announcements every 30 seconds
    const interval = setInterval(fetchAnnouncements, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh announcements when opened
  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/announcements/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark individual announcement as read
  const markAsRead = async (announcementId, event) => {
    event.stopPropagation();
    
    try {
      setMarkingRead(prev => ({ ...prev, [announcementId]: true }));
      
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setAnnouncements(prev => 
          prev.map(announcement => 
            announcement.id === announcementId 
              ? { ...announcement, is_read: 1, read_at: new Date().toISOString() }
              : announcement
          )
        );
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    } finally {
      setMarkingRead(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  // Mark all announcements as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${API_URL}/student-batches/announcements/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setAnnouncements(prev => 
          prev.map(announcement => ({ 
            ...announcement, 
            is_read: 1, 
            read_at: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all announcements as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-blue-50 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white rounded-full p-0"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Announcements</h3>
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No announcements available</p>
                <p className="text-gray-400 text-xs mt-1">Check back later for updates</p>
              </div>
            ) : (
              <div className="space-y-1">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                      announcement.is_read ? 'opacity-75' : 'bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                          {getPriorityIcon(announcement.priority)}
                          <span className="ml-1 capitalize">{announcement.priority}</span>
                        </div>
                        {announcement.is_read ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCheck className="w-3 h-3 mr-1" />
                            Read
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                    
                    <h4 className={`font-medium text-sm mb-1 line-clamp-1 ${
                      announcement.is_read ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {announcement.title}
                    </h4>
                    
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span className="truncate">
                            {announcement.batch_code} - {announcement.courseName}
                          </span>
                        </div>
                        {announcement.lecturer_name && (
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="truncate">
                              By {announcement.lecturer_name}
                            </span>
                            {announcement.read_at && (
                              <span className="ml-2 text-green-600">
                                • Read {formatDate(announcement.read_at)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!announcement.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => markAsRead(announcement.id, e)}
                          disabled={markingRead[announcement.id]}
                          className="text-xs text-blue-600 hover:bg-blue-100 p-1 h-auto"
                        >
                          {markingRead[announcement.id] ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent" />
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Mark Read
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {announcements.length > 0 && unreadCount > 0 && (
            <div className="border-t border-gray-200 p-3">
              <Button
                variant="ghost"
                onClick={markAllAsRead}
                disabled={loading}
                className="w-full text-blue-600 hover:bg-blue-50 text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border border-blue-500 border-t-transparent mr-2" />
                    Marking all as read...
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all as read
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications; 