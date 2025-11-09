"use client"

import { useRouter } from "next/navigation"
import { OptiQueueLogo } from "@/components/optiqueue/optiqueue-logo"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Floating Medical Icons */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {i % 4 === 0 && <div className="text-2xl text-primary">⚕️</div>}
              {i % 4 === 1 && <div className="text-2xl text-green-400">🏥</div>}
              {i % 4 === 2 && <div className="text-2xl text-blue-400">📊</div>}
              {i % 4 === 3 && <div className="text-2xl text-teal-400">⏰</div>}
            </div>
          ))}
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className={`w-full max-w-2xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-primary via-teal-500 to-blue-600 p-8 text-center">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <OptiQueueLogo className="w-24 h-24 drop-shadow-lg animate-pulse-slow" />
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                  </div>
                </div>
                
                {/* Title */}
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                  Opti<span className="text-teal-200">Queue</span>
                </h1>
                <p className="text-teal-100 text-lg font-medium mb-2">
                  Efficiency that Saves Lives
                </p>
                <p className="text-white/80 text-sm">
                  Choose your login portal to access the system
                </p>
              </div>
            </div>

            {/* Login Options */}
            <div className="p-8 space-y-4">
              {/* Admin Login Button */}
              <button
                onClick={() => router.push("/admin-login")}
                className="group w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold">Admin Portal</div>
                    <div className="text-blue-100 text-sm">System Administration & Analytics</div>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Doctor Login Button */}
              <button
                onClick={() => router.push("/doctor-login")}
                className="group w-full relative overflow-hidden bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold">Doctor Portal</div>
                    <div className="text-teal-100 text-sm">Patient Management & Scheduling</div>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-8 pb-6 text-center">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <span>© 2024 OptiQueue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

