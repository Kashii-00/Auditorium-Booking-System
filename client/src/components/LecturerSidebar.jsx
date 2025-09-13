import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  BookOpen,
  Calendar,
  Users,
  Key,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  FileText
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const LecturerSidebar = ({ 
  lecturer, 
  activeTab, 
  onTabChange, 
  onChangePassword,
  onSidebarToggle 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Notify parent when sidebar state changes
  useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(isOpen);
    }
  }, [isOpen, onSidebarToggle]);

  // Close mobile sidebar when screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "N/A";
  };

  const navigationItems = [
    { id: "overview", label: "Overview", icon: User },
    { id: "courses", label: "My Courses", icon: BookOpen },
    { id: "batches", label: "My Batches", icon: Calendar }
  ];

  const sidebarVariants = {
    open: {
      width: 320,
      transition: {
        duration: 0.4,
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    },
    closed: {
      width: 80,
      transition: {
        duration: 0.4,
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    }
  };

  const contentVariants = {
    open: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: 0.15,
        ease: "easeOut"
      }
    },
    closed: {
      opacity: 0,
      scale: 0.9,
      x: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const mobileOverlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.2 }
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const mobileSidebarVariants = {
    open: {
      x: 0,
      transition: {
        duration: 0.4,
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    },
    closed: {
      x: "-100%",
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.div
        className="fixed top-24 left-4 z-50 lg:hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={() => setIsMobileOpen(true)}
          className="bg-white/90 backdrop-blur-sm shadow-lg border border-white/20 hover:bg-white/95 hover:shadow-xl transition-all duration-200 group"
          size="icon"
        >
          <Menu className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors duration-200" />
        </Button>
      </motion.div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            variants={mobileOverlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        className="hidden lg:flex fixed left-0 top-20 h-[calc(100vh-5rem)] bg-white/90 backdrop-blur-xl border-r border-white/30 shadow-2xl z-30"
        variants={sidebarVariants}
        animate={isOpen ? "open" : "closed"}
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        }}
      >
        {/* Desktop Toggle Button */}
        <motion.div
          className="absolute -right-4 top-8 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            boxShadow: [
              "0 4px 8px rgba(0,0,0,0.1)",
              "0 6px 12px rgba(5,150,105,0.15)",
              "0 4px 8px rgba(0,0,0,0.1)"
            ]
          }}
          transition={{ 
            boxShadow: { 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          }}
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200 p-0 group"
            size="icon"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {isOpen ? (
                <PanelLeftClose className="w-4 h-4 text-gray-600 group-hover:text-emerald-600" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-gray-600 group-hover:text-emerald-600" />
              )}
            </motion.div>
          </Button>
        </motion.div>

        <div className="flex flex-col h-full pt-4">
          {/* Profile Section */}
          <div className="relative px-4 pb-6">
            <AnimatePresence>
              {isOpen ? (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="text-center"
                >
                  {/* Profile Header Background */}
                  <div className="relative mb-6">
                    <div className="h-24 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-xl"></div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                        <AvatarImage src={lecturer?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-lg font-semibold">
                          {getInitials(lecturer?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  <div className="pt-8">
                    <h2 className="text-lg font-bold text-slate-800 truncate">
                      {lecturer?.full_name || "Lecturer Name"}
                    </h2>
                    <p className="text-sm text-slate-500 mb-3">
                      {lecturer?.lecturer_id || "Lecturer ID"}
                    </p>
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                      Active Lecturer
                    </Badge>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="flex justify-center"
                >
                  <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                    <AvatarImage src={lecturer?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold">
                      {getInitials(lecturer?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator className="mx-4 mb-4" />

          {/* Navigation */}
          <nav className="flex-1 px-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  variant="ghost"
                  className={`w-full transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  } ${isOpen ? 'justify-start px-4' : 'justify-center px-2'}`}
                >
                  <item.icon className={`w-5 h-5 ${isOpen ? 'mr-3' : ''}`} />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        variants={contentVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="flex-1 text-left"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isOpen && (
                    <ChevronRight
                      className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                        activeTab === item.id ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </Button>
              ))}
            </div>
          </nav>

          <Separator className="mx-4 mb-4" />

          {/* Change Password */}
          <div className="px-4 pb-6">
            <Button
              onClick={onChangePassword}
              variant="ghost"
              className={`w-full hover:bg-slate-50 text-slate-700 ${
                isOpen ? 'justify-start px-4' : 'justify-center px-2'
              }`}
            >
              <Key className={`w-5 h-5 ${isOpen ? 'mr-3' : ''}`} />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    variants={contentVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="flex-1 text-left"
                  >
                    Change Password
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-80 bg-white/95 backdrop-blur-xl border-r border-white/30 shadow-2xl z-50 lg:hidden"
            variants={mobileSidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            }}
          >
            {/* Mobile Close Button */}
            <motion.div
              className="absolute right-4 top-4 z-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200 p-0 group"
                size="icon"
              >
                <X className="w-4 h-4 text-gray-600 group-hover:text-red-500 transition-colors duration-200" />
              </Button>
            </motion.div>

            <div className="flex flex-col h-full pt-16">
              {/* Mobile Profile Section */}
              <div className="px-6 pb-6">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="h-24 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-xl"></div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                        <AvatarImage src={lecturer?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-lg font-semibold">
                          {getInitials(lecturer?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  <div className="pt-8">
                    <h2 className="text-lg font-bold text-slate-800">
                      {lecturer?.full_name || "Lecturer Name"}
                    </h2>
                    <p className="text-sm text-slate-500 mb-3">
                      {lecturer?.lecturer_id || "Lecturer ID"}
                    </p>
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                      Active Lecturer
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="mx-6 mb-4" />

              {/* Mobile Navigation */}
              <nav className="flex-1 px-6">
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsMobileOpen(false);
                      }}
                      variant="ghost"
                      className={`w-full justify-start px-4 transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                          activeTab === item.id ? 'rotate-90' : ''
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </nav>

              <Separator className="mx-6 mb-4" />

              {/* Mobile Change Password */}
              <div className="px-6 pb-6">
                <Button
                  onClick={() => {
                    onChangePassword();
                    setIsMobileOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start px-4 hover:bg-slate-50 text-slate-700"
                >
                  <Key className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">Change Password</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LecturerSidebar; 