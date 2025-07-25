"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  FaSearch,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaUserShield,
  FaUser,
  FaCrown,
  FaSort,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"
import { Target,UserRoundCog } from "lucide-react"
import { authRequest } from "../../services/authService"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const ROLE_LABELS = {
  SuperAdmin: {
    label: "Super Admin",
    color: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border border-yellow-200",
    icon: FaCrown,
  },
  Admin: {
    label: "Admin",
    color: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200",
    icon: FaUserShield,
  },
  User: {
    label: "User",
    color: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200",
    icon: FaUser,
  },
}



const STATUS_COLORS = {
  ACTIVE: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200",
  INACTIVE: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200",
  SUSPENDED: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200",
}

const getMainRole = (roles) => {
  if (roles.includes("SuperAdmin")) return "SuperAdmin"
  if (roles.includes("ADMIN")) return "Admin"
  return "User"
}

const UserDetails = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [hoveredRoleIdx, setHoveredRoleIdx] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedUserId, setHighlightedUserId] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, visible: false })

  const USERS_PER_PAGE = 4
  const currentUserId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarState") === "true")

  // Memoized filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))

      const userRoles = typeof user.role === "string" ? JSON.parse(user.role) : user.role
      const roles = Array.isArray(userRoles) ? userRoles : [userRoles]
      const mainRole = getMainRole(roles)

      const matchesRole = roleFilter === "all" || mainRole === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === "role") {
        const aRoles = typeof a.role === "string" ? JSON.parse(a.role) : a.role
        const bRoles = typeof b.role === "string" ? JSON.parse(b.role) : b.role
        aValue = getMainRole(Array.isArray(aRoles) ? aRoles : [aRoles])
        bValue = getMainRole(Array.isArray(bRoles) ? bRoles : [bRoles])
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / USERS_PER_PAGE)
  const paginatedUsers = filteredAndSortedUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      // Add minimum loading time to show the loading screen
      const [userData] = await Promise.all([
        authRequest("get", "http://localhost:5003/api/users"),
        new Promise((resolve) => setTimeout(resolve, 1000)), // Minimum 1 second loading
      ])
      setUsers(userData)
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Sidebar state management
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState")
      if (stored !== null) {
        const isCollapsed = stored === "true"
        setSidebarCollapsed(isCollapsed)

        if (isCollapsed) {
          document.body.classList.add("sidebar-collapsed")
        } else {
          document.body.classList.remove("sidebar-collapsed")
        }

        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: { isCollapsed },
          }),
        )
      }
    }

    syncSidebarState()
    window.addEventListener("popstate", syncSidebarState)

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed)
      localStorage.setItem("sidebarState", e.detail.isCollapsed)

      if (e.detail.isCollapsed) {
        document.body.classList.add("sidebar-collapsed")
      } else {
        document.body.classList.remove("sidebar-collapsed")
      }
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("popstate", syncSidebarState)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  // Handle highlighting from navigation
  useEffect(() => {
    const highlightId = location.state?.highlightedUserId || localStorage.getItem("highlightedUserId")
    if (highlightId) {
      setHighlightedUserId(Number.parseInt(highlightId))
      localStorage.removeItem("highlightedUserId")

      // Auto-remove highlight after 5 seconds
      const timer = setTimeout(() => {
        setHighlightedUserId(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [location.state])

  const deleteUser = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        return
      }

      try {
        await authRequest("delete", `http://localhost:5003/api/users/${id}`)
        await fetchUsers()
      } catch (err) {
        console.error("Error deleting user:", err)
        alert("Failed to delete user. Please try again.")
      }
    },
    [fetchUsers],
  )

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const parseRoles = (roleStr) => {
    try {
      const arr = JSON.parse(roleStr)
      return Array.isArray(arr) ? arr : [arr]
    } catch {
      return [roleStr]
    }
  }

  // Summary statistics
  const stats = useMemo(() => {
    const totalUsers = users.length
    const admins = users.filter((u) => parseRoles(u.role).includes("ADMIN")).length
    const superAdmins = users.filter((u) => parseRoles(u.role).includes("SuperAdmin")).length
    const normalUsers = users.filter((u) => {
      const roles = parseRoles(u.role)
      return !roles.includes("SuperAdmin") && !roles.includes("ADMIN")
    }).length
    const activeUsers = users.filter((u) => u.status === "ACTIVE").length

    return { totalUsers, admins, superAdmins, normalUsers, activeUsers }
  }, [users])

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <LoadingScreen message="Loading Users" type="users" />
  }

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 transition-all duration-300 overflow-x-hidden"
      style={{
        paddingLeft: sidebarCollapsed ? "50px" : "50px",
      }}
    >
      <div className="p-4 lg:p-6 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex-shrink-0">
                <UserRoundCog className="h-9 w-9 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-black gradient-text whitespace-nowrap">User Management Dashboard</h1>
                <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1">
                  <Target className="h-3 w-3 flex-shrink-0" />
                  Manage system users, roles, and permissions
                </p>
              </div>
            </div>
            <Link
              to="/create-user"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaUserPlus className="mr-2" />
              Add New User
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8 w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Super Admins</p>
                <p className="text-3xl font-bold text-slate-800">{stats.superAdmins}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                <FaCrown className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Admins</p>
                <p className="text-3xl font-bold text-slate-800">{stats.admins}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                <FaUserShield className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Regular Users</p>
                <p className="text-3xl font-bold text-slate-800">{stats.normalUsers}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <FaUser className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-white/20 mb-4 lg:mb-6 w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <option value="all">All Roles</option>
                <option value="SuperAdmin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-blue-800 text-white">
                  <th
                    className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <FaSort className={`text-sm ${sortField === "name" ? "text-blue-300" : "text-slate-400"}`} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <FaSort className={`text-sm ${sortField === "email" ? "text-blue-300" : "text-slate-400"}`} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">Phone</th>
                  <th
                    className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-2">
                      Role
                      <FaSort className={`text-sm ${sortField === "role" ? "text-blue-300" : "text-slate-400"}`} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <FaSort className={`text-sm ${sortField === "status" ? "text-blue-300" : "text-slate-400"}`} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <FaUsers className="mx-auto text-4xl mb-4 text-slate-300" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, idx) => {
                    const roles = parseRoles(user.role)
                    const mainRole = getMainRole(roles)
                    const badge = ROLE_LABELS[mainRole]
                    const accessLevels = roles.filter((r) => r !== "SuperAdmin" && r !== "ADMIN" && r !== "USER")
                    const isHighlighted = highlightedUserId === user.id
                    const IconComponent = badge.icon

                    return (
                      <tr
                        key={user.id}
                        className={`
                          border-b border-slate-100 hover:bg-blue-50/50 transition-all duration-200
                          ${idx % 2 === 0 ? "bg-white/50" : "bg-slate-50/50"}
                          ${isHighlighted ? "bg-gradient-to-r from-blue-100 to-indigo-100 animate-pulse" : ""}
                        `}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4 text-slate-600">{user.phone || "-"}</td>
                        <td className="px-6 py-4 relative">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 ${badge.color}`}
                            onMouseEnter={(e) => {
                              if (accessLevels.length > 0) {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const scrollY = window.scrollY
                                const scrollX = window.scrollX

                                // Calculate optimal position
                                let x = rect.left + scrollX
                                let y = rect.bottom + scrollY + 8

                                // Adjust if tooltip would go off-screen
                                const tooltipWidth = 256 // w-64 = 16rem = 256px
                                const tooltipHeight = 120 // estimated height

                                if (x + tooltipWidth > window.innerWidth) {
                                  x = window.innerWidth - tooltipWidth - 16
                                }

                                if (y + tooltipHeight > window.innerHeight + scrollY) {
                                  y = rect.top + scrollY - tooltipHeight - 8
                                }

                                setTooltipPosition({ x, y, visible: true, accessLevels, userIndex: idx })
                              }
                            }}
                            onMouseLeave={() => {
                              setTooltipPosition({ x: 0, y: 0, visible: false, accessLevels: [], userIndex: null })
                            }}
                          >
                            <IconComponent className="text-sm" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[user.status]}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {String(user.id) === String(currentUserId) ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-semibold border border-green-200">
                              <FaUser className="text-xs" />
                              Current User
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/create-user/${user.id}`)}
                                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200"
                                title="Edit user"
                              >
                                <FaEdit className="text-xs" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 rounded-lg text-xs font-semibold hover:from-red-100 hover:to-rose-100 transition-all duration-200 border border-red-200"
                                title="Delete user"
                              >
                                <FaTrash className="text-xs" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Showing {paginatedUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1}-
                {Math.min(currentPage * USERS_PER_PAGE, filteredAndSortedUsers.length)} of{" "}
                {filteredAndSortedUsers.length} users
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <FaChevronLeft className="text-xs" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentPage === page
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portal-based Access Levels Tooltip */}
      {tooltipPosition.visible &&
        tooltipPosition.accessLevels &&
        tooltipPosition.accessLevels.length > 0 &&
        createPortal(
          <div
            className="fixed z-[9999] w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 text-sm animate-fadeIn pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            <div className="font-semibold text-slate-800 mb-2">Access Levels</div>
            <div className="space-y-1">
              {tooltipPosition.accessLevels.map((level, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {level.replace("_access", "").replace("_", " ").toUpperCase()}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}

      {/* Animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

export default UserDetails
