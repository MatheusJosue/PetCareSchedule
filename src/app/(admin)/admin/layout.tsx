import { Header } from "@/components/layout/header"

export default function AdminLayout({
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
      <Header
        variant="admin"
        user={{
          name: "Admin",
          email: "admin@petcare.com",
        }}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center">
        <div style={{ padding: '16px 24px', paddingBottom: '32px', boxSizing: 'border-box', width: '100%', maxWidth: '1024px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
