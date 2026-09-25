import type { ReactNode } from "react"
import { AccountLoginRedirect } from "@/components/account-login-redirect"

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <><AccountLoginRedirect />{children}</>
}
