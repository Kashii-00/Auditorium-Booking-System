"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: "destructive";
};

type ToastContextType = {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;      // renamed here
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (t: Omit<Toast, "id">) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, ...t }]);
    // auto-remove after 5s
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <ToasterRenderer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

// Simple renderer; place it here or import from a separate file
function ToasterRenderer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={[
            "p-4 rounded shadow-lg max-w-xs",
            variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-black",
          ].join(" ")}
        >
          <div className="font-bold">{title}</div>
          {description && <div className="mt-1 text-sm">{description}</div>}
          <button
            className="absolute top-1 right-1 text-xs"
            onClick={() => onRemove(id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

