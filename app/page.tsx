'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Navbar */}
      <header className="flex justify-between items-center py-6 px-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-blue-600">ChatterBox</h1>
        <nav className="space-x-6">
          <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium">
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-grow text-center px-6 py-16">
        <div className="max-w-3xl">
          <h2 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Connect. Chat. Collaborate.
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            ChatterBox lets you communicate seamlessly with friends, teams, and communities — all in one simple, secure chat platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6 grid gap-10 md:grid-cols-3 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              💬
            </div>
            <h3 className="font-bold text-lg mb-2">Instant Messaging</h3>
            <p className="text-gray-600 text-sm">
              Real-time chat with smooth message delivery and smart notifications.
            </p>
          </div>

          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              🔒
            </div>
            <h3 className="font-bold text-lg mb-2">Secure Conversations</h3>
            <p className="text-gray-600 text-sm">
              Your messages stay private and protected with modern encryption.
            </p>
          </div>

          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
              ⚡
            </div>
            <h3 className="font-bold text-lg mb-2">Fast & Lightweight</h3>
            <p className="text-gray-600 text-sm">
              Built for performance — minimal lag, maximum clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ChatterBox. All rights reserved.
      </footer>
    </main>
  )
}
