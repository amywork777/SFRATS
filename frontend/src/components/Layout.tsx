import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      {title && <Header title={title} />}

      {/* Main content with padding */}
      <div className="p-4">
        {children}
      </div>

      {/* Mobile Footer Spacer */}
      <div className="h-32 md:hidden">
        {/* Empty div to create space at bottom on mobile */}
      </div>
    </div>
  )
} 