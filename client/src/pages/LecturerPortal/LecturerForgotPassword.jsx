import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

const LecturerForgotPassword = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        <p className="text-gray-600 mb-6">Password reset functionality coming soon...</p>
        <Button onClick={() => navigate("/")} className="w-full">
          Back to Login
        </Button>
      </div>
    </div>
  )
}

export default LecturerForgotPassword 