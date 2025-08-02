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

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    onSubmit(e)
  }, [onSubmit])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex justify-center items-center z-50 p-4 ${isClosing ? "closing" : ""}`}
    >
      <Card
        className={`w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border-0 ${isClosing ? "closing" : ""}`}
      >
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-2xl py-2 mt-[-26px]">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Reserve Auditorium
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="h-2 w-2 text-white" />
                  </div>
                  <span className="font-bold text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="booking-date" className="text-sm font-black text-slate-700">
                Date
              </Label>
              <Input
                id="booking-date"
                type="date"
                value={formData.bookingDate}
                onChange={(e) => onFormDataChange('bookingDate', e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-black text-slate-700">Time</Label>
              <div className="flex items-center gap-2">
                <Select value={formData.startTime} onValueChange={(value) => onFormDataChange('startTime', value)} required>
                  <SelectTrigger className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg">
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
                <span className="text-slate-500 font-black text-sm">to</span>
                <Select value={formData.endTime} onValueChange={(value) => onFormDataChange('endTime', value)} required>
                  <SelectTrigger className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg">
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

            <div className="space-y-2">
              <Label htmlFor="attendees" className="text-sm font-black text-slate-700">
                Attendees
              </Label>
              <Input
                id="attendees"
                type="number"
                value={formData.attendees}
                onChange={(e) => onFormDataChange('attendees', Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-black text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter event description"
                value={formData.description}
                onChange={(e) => onFormDataChange('description', e.target.value)}
                className="border-2 border-slate-200 focus:border-blue-500 rounded-xl min-h-[80px] text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-bold rounded-xl border-2 hover:bg-slate-50 shadow-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
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