"use client"

import { useEffect } from "react"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const SuccessPopup = ({ message, onClose, autoClose = true, duration = 3000 }) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium flex-1">{message}</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-green-600">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SuccessPopup
