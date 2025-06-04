import { useToast } from "@/components/ui/use-toast"
import { createContext, useContext } from "react"

type ToastContextType = {
  toast: ReturnType<typeof useToast>["toast"]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { toast } = useToast()

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
}
