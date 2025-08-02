import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Mail,
  Globe,
  Palette,
  Monitor,
  Volume2,
  Eye,
  Shield,
  Smartphone,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

const StudentPreferences = () => {
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)
  const [preferences, setPreferences] = useState({
    // Appearance
    theme: "system",
    accentColor: "blue",
    fontSize: "medium",
    reducedMotion: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    courseUpdates: true,
    paymentReminders: true,
    batchNotifications: true,
    
    // Language & Region
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    
    // Privacy
    showProfile: true,
    showEmail: false,
    twoFactorAuth: false,
    
    // Accessibility
    highContrast: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    
    // Other
    autoSave: true,
    soundEffects: true,
    compactView: false,
  })

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem("studentPreferences")
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const handleDarkModeToggle = (checked) => {
    setDarkMode(checked)
    localStorage.setItem("darkMode", checked.toString())
    if (checked) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handlePreferenceChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    localStorage.setItem("studentPreferences", JSON.stringify(newPreferences))
  }

  const handleSaveAll = () => {
    localStorage.setItem("studentPreferences", JSON.stringify(preferences))
    // Show success toast or notification
  }

  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to reset all preferences to default?")) {
      localStorage.removeItem("studentPreferences")
      localStorage.removeItem("darkMode")
      window.location.reload()
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50'} relative overflow-hidden transition-colors duration-300`}>
      {/* Background glass texture */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      {/* Header */}
      <div className={`sticky top-0 z-40 ${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl border-b ${darkMode ? 'border-slate-700' : 'border-white/30'} shadow-lg transition-colors duration-300`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/student-dashboard")}
                className={`${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-blue-50'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Preferences
              </h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleResetAll}
                className={`${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
              >
                Reset All
              </Button>
              <Button
                onClick={handleSaveAll}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`shadow-xl border-0 ${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${darkMode ? 'text-slate-100' : ''}`}>
                  <Palette className="w-5 h-5 mr-2 text-blue-600" />
                  Appearance
                </CardTitle>
                <CardDescription className={darkMode ? 'text-slate-400' : ''}>
                  Customize how the portal looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={`text-base ${darkMode ? 'text-slate-200' : ''}`}>
                      Dark Mode
                    </Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Toggle dark theme for better viewing at night
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-yellow-500'}`} />
                    <Switch
                      checked={darkMode}
                      onCheckedChange={handleDarkModeToggle}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <Moon className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-slate-400'}`} />
                  </div>
                </div>

                <Separator className={darkMode ? 'bg-slate-700' : ''} />

                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className={darkMode ? 'text-slate-200' : ''}>Theme Preference</Label>
                  <RadioGroup
                    value={preferences.theme}
                    onValueChange={(value) => handlePreferenceChange("theme", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className={darkMode ? 'text-slate-300' : ''}>
                        Always Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className={darkMode ? 'text-slate-300' : ''}>
                        Always Dark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className={darkMode ? 'text-slate-300' : ''}>
                        Follow System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator className={darkMode ? 'bg-slate-700' : ''} />

                {/* Accent Color */}
                <div className="space-y-3">
                  <Label className={darkMode ? 'text-slate-200' : ''}>Accent Color</Label>
                  <Select
                    value={preferences.accentColor}
                    onValueChange={(value) => handlePreferenceChange("accentColor", value)}
                  >
                    <SelectTrigger className={darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <Label className={darkMode ? 'text-slate-200' : ''}>Font Size</Label>
                  <RadioGroup
                    value={preferences.fontSize}
                    onValueChange={(value) => handlePreferenceChange("fontSize", value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="small" />
                      <Label htmlFor="small" className={darkMode ? 'text-slate-300' : ''}>
                        Small
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className={darkMode ? 'text-slate-300' : ''}>
                        Medium
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="large" />
                      <Label htmlFor="large" className={darkMode ? 'text-slate-300' : ''}>
                        Large
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={`text-base ${darkMode ? 'text-slate-200' : ''}`}>
                      Reduce Motion
                    </Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={preferences.reducedMotion}
                    onCheckedChange={(checked) => handlePreferenceChange("reducedMotion", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className={`shadow-xl border-0 ${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${darkMode ? 'text-slate-100' : ''}`}>
                  <Bell className="w-5 h-5 mr-2 text-blue-600" />
                  Notifications
                </CardTitle>
                <CardDescription className={darkMode ? 'text-slate-400' : ''}>
                  Manage how you receive updates and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>Email Notifications</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>Push Notifications</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange("pushNotifications", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <Separator className={darkMode ? 'bg-slate-700' : ''} />

                <div className="space-y-3">
                  <Label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : ''}`}>
                    Notification Types
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className={`font-normal ${darkMode ? 'text-slate-400' : ''}`}>
                        Course Updates
                      </Label>
                      <Switch
                        checked={preferences.courseUpdates}
                        onCheckedChange={(checked) => handlePreferenceChange("courseUpdates", checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className={`font-normal ${darkMode ? 'text-slate-400' : ''}`}>
                        Payment Reminders
                      </Label>
                      <Switch
                        checked={preferences.paymentReminders}
                        onCheckedChange={(checked) => handlePreferenceChange("paymentReminders", checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className={`font-normal ${darkMode ? 'text-slate-400' : ''}`}>
                        Batch Notifications
                      </Label>
                      <Switch
                        checked={preferences.batchNotifications}
                        onCheckedChange={(checked) => handlePreferenceChange("batchNotifications", checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Language & Region */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className={`shadow-xl border-0 ${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${darkMode ? 'text-slate-100' : ''}`}>
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Language & Region
                </CardTitle>
                <CardDescription className={darkMode ? 'text-slate-400' : ''}>
                  Set your language and regional preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className={darkMode ? 'text-slate-200' : ''}>Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => handlePreferenceChange("language", value)}
                  >
                    <SelectTrigger className={darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className={darkMode ? 'text-slate-200' : ''}>Date Format</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) => handlePreferenceChange("dateFormat", value)}
                  >
                    <SelectTrigger className={darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className={darkMode ? 'text-slate-200' : ''}>Time Format</Label>
                  <RadioGroup
                    value={preferences.timeFormat}
                    onValueChange={(value) => handlePreferenceChange("timeFormat", value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="12h" id="12h" />
                      <Label htmlFor="12h" className={darkMode ? 'text-slate-300' : ''}>
                        12-hour
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="24h" id="24h" />
                      <Label htmlFor="24h" className={darkMode ? 'text-slate-300' : ''}>
                        24-hour
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className={`shadow-xl border-0 ${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${darkMode ? 'text-slate-100' : ''}`}>
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Privacy & Security
                </CardTitle>
                <CardDescription className={darkMode ? 'text-slate-400' : ''}>
                  Control your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>Show Profile to Others</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Allow other students to view your profile
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showProfile}
                    onCheckedChange={(checked) => handlePreferenceChange("showProfile", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>Show Email Address</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Display your email to other users
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showEmail}
                    onCheckedChange={(checked) => handlePreferenceChange("showEmail", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>Two-Factor Authentication</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Add an extra layer of security
                    </p>
                  </div>
                  <Switch
                    checked={preferences.twoFactorAuth}
                    onCheckedChange={(checked) => handlePreferenceChange("twoFactorAuth", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Accessibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className={`shadow-xl border-0 ${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${darkMode ? 'text-slate-100' : ''}`}>
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Accessibility
                </CardTitle>
                <CardDescription className={darkMode ? 'text-slate-400' : ''}>
                  Make the portal easier to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>High Contrast Mode</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <Switch
                    checked={preferences.highContrast}
                    onCheckedChange={(checked) => handlePreferenceChange("highContrast", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>Screen Reader Optimization</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Optimize for screen readers
                    </p>
                  </div>
                  <Switch
                    checked={preferences.screenReaderOptimized}
                    onCheckedChange={(checked) => handlePreferenceChange("screenReaderOptimized", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className={darkMode ? 'text-slate-200' : ''}>Keyboard Navigation</Label>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Navigate using keyboard shortcuts
                    </p>
                  </div>
                  <Switch
                    checked={preferences.keyboardNavigation}
                    onCheckedChange={(checked) => handlePreferenceChange("keyboardNavigation", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default StudentPreferences 