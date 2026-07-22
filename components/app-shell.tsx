import { BottomNav } from "./bottom-nav"

interface AppShellProps {
  children: React.ReactNode
  hideNav?: boolean
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <main className={hideNav ? "" : "pb-24"}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
