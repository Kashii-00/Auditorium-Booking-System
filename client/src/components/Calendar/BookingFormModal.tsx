import React, { memo, useCallback } from "react"

interface BookingFormModalProps {
  isOpen: boolean
  isClosing: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  formData: {
    bookingDate: string
    startTime: string
    endTime: string
    attendees: number
    description: string
  }
  onFormDataChange: (field: string, value: any) => void
  timeSlots: Array<{ value: string; display: string }>
  filteredEndTimeSlots: Array<{ value: string; display: string }>
  isSubmitting: boolean
  error?: string
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X, Sparkles } from "lucide-react"

const BookingFormModal = memo<BookingFormModalProps>(({
  isOpen,
  isClosing,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  timeSlots,
  filteredEndTimeSlots,
  isSubmitting,
  error
}) => {
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }, [onSubmit])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex justify-center items-center z-50 p-4 sm:p-4 ${isClosing ? "closing" : ""}`}
    >
      <Card
        className={`w-full max-w-sm sm:max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto shadow-2xl border-0 mx-4 sm:mx-0 my-6 sm:my-0 ${isClosing ? "closing" : ""}`}
      >
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-xl sm:rounded-t-2xl py-3 sm:py-4 -mt-0">
          <CardTitle className="text-sm sm:text-lg font-black flex items-center gap-1 sm:gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Reserve Auditorium</span>
            <span className="sm:hidden">Reserve</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg sm:rounded-xl p-1 sm:p-2"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border border-red-200 text-red-700 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="booking-date" className="text-xs sm:text-sm font-bold sm:font-black text-slate-700">
                Date
              </Label>
              <Input
                id="booking-date"
                type="date"
                value={formData.bookingDate}
                onChange={(e) => onFormDataChange('bookingDate', e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-8 sm:h-10 border border-slate-200 focus:border-blue-500 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white shadow-sm"
                required
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-bold sm:font-black text-slate-700">Time</Label>
              <div className="flex items-center gap-1 sm:gap-2">
                <Select value={formData.startTime} onValueChange={(value) => onFormDataChange('startTime', value)} required>
                  <SelectTrigger className="h-8 sm:h-10 border border-slate-200 focus:border-blue-500 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white shadow-sm">
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-slate-500 font-bold text-xs sm:text-sm">to</span>
                <Select value={formData.endTime} onValueChange={(value) => onFormDataChange('endTime', value)} required>
                  <SelectTrigger className="h-8 sm:h-10 border border-slate-200 focus:border-blue-500 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white shadow-sm">
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEndTimeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="attendees" className="text-xs sm:text-sm font-bold sm:font-black text-slate-700">
                Attendees
              </Label>
              <Input
                id="attendees"
                type="number"
                value={formData.attendees}
                onChange={(e) => onFormDataChange('attendees', Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="h-8 sm:h-10 border border-slate-200 focus:border-blue-500 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white shadow-sm"
                required
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm font-bold sm:font-black text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter event description"
                value={formData.description}
                onChange={(e) => onFormDataChange('description', e.target.value)}
                className="border border-slate-200 focus:border-blue-500 rounded-lg sm:rounded-xl min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm bg-white shadow-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl border hover:bg-slate-50 shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-lg sm:rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Submitting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
})

BookingFormModal.displayName = "BookingFormModal"



export default BookingFormModal