"use client"

import { Suspense } from "react"
import { DoctorDashboard } from "@/components/optiqueue/doctor/doctor-dashboard"
import { ProtectedRoute } from "@/components/optiqueue/auth/protected-route"

export default function DoctorPage() {
  return (
    <ProtectedRoute allowedRoles={["Doctor", "Administrator"]}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading Doctor Dashboard...</div>
        </div>
      }>
        <DoctorDashboard />
      </Suspense>
    </ProtectedRoute>
  )
}

