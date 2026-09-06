export const runtime = 'edge'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-primary text-white rounded-lg font-medium">
        Return to Home
      </Link>
    </div>
  )
}
