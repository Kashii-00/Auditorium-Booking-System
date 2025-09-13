import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = ({
    title = "",
    description = "",
    type = "default", // default, success, error, warning
    duration = 3000,
    action,
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast = {
      id,
      title,
      description,
      type,
      action,
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  };

  const dismissToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return {
    toast,
    dismissToast,
    toasts,
  };
}
