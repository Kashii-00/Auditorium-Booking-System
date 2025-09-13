import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { getApiUrl } from '../utils/apiUrl'

// Custom hook for event calendar logic
export const useEventCalendar = (user) => {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")

      const [response] = await Promise.all([
        axios.get(getApiUrl("/bookings"), {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ])

      const eventsData = Array.isArray(response.data) ? response.data : []
      setEvents(eventsData)
      console.log("Events loaded successfully:", eventsData.length, "events")
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
      setError("Failed to load events. Please try again.")
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 100)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Memoized filtered events to prevent unnecessary recalculations
  const { upcomingEvents, pastEvents, filteredUpcomingEvents, filteredPastEvents } = useMemo(() => {
    try {
      const now = new Date()

      const upcoming = events
        .filter((event) => {
          try {
            return new Date(event.booking_date + "T" + event.booking_time) >= now
          } catch {
            return false
          }
        })
        .sort((a, b) => {
          try {
            return (
              new Date(a.booking_date + "T" + a.booking_time).getTime() -
              new Date(b.booking_date + "T" + b.booking_time).getTime()
            )
          } catch {
            return 0
          }
        })

      const past = events.filter((event) => {
        try {
          return new Date(event.booking_date + "T" + event.booking_time) < now
        } catch {
          return false
        }
      })

      const filteredUpcoming = upcoming.filter((event) =>
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      const filteredPast = past.filter((event) => event.description?.toLowerCase().includes(searchQuery.toLowerCase()))

      return {
        upcomingEvents: upcoming,
        pastEvents: past,
        filteredUpcomingEvents: filteredUpcoming,
        filteredPastEvents: filteredPast,
      }
    } catch (error) {
      console.error("Error filtering events:", error)
      return {
        upcomingEvents: [],
        pastEvents: [],
        filteredUpcomingEvents: [],
        filteredPastEvents: [],
      }
    }
  }, [events, searchQuery])

  // Create booking
  const createBooking = useCallback(async (bookingData) => {
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        getApiUrl("/bookings"),
        {
          user_id: user.id,
          ...bookingData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      
      // Refresh events
      fetchEvents()
      return true
    } catch (error) {
      console.error("Booking error:", error)
      throw new Error("Failed to create booking")
    }
  }, [user.id, fetchEvents])

  return {
    events,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    setError,
    upcomingEvents,
    pastEvents,
    filteredUpcomingEvents,
    filteredPastEvents,
    fetchEvents,
    createBooking,
  }
}