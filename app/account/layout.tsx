import type { ReactNode } from "react"
import { AccountAvatarDelete } from "@/components/account-avatar-delete"
import { AccountLoginRedirect } from "@/components/account-login-redirect"

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <><AccountLoginRedirect /><AccountAvatarDelete />{children}</>
}
