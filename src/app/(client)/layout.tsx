import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col min-h-screen transition-colors duration-200"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <Header variant="client" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center">
        <div className="w-full max-w-6xl" style={{ padding: '24px', paddingBottom: '100px' }}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
