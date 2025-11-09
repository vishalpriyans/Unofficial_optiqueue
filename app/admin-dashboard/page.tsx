"use client"

import { Suspense } from "react"
import { SessionProtection } from "@/components/auth/session-protection"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gantt } from "@/components/optiqueue/gantt"
import { ControlTowerKPIs } from "@/components/optiqueue/control-tower-kpis"
import { EmergencyInserter } from "@/components/optiqueue/emergency-inserter"
import { VoiceAssistant } from "@/components/optiqueue/voice-assistant"
import { EmergencyIcon } from "@/components/optiqueue/3d-icons"
import { ConflictDisplay } from "@/components/optiqueue/conflict-display"
import { detectConflicts } from "@/components/optiqueue/conflict-detector"
import { useSchedule, useSurgeries, useWeeklySchedule } from "@/components/optiqueue/store"
import { optimizeSchedule, computeKPIs, baselineSchedule } from "@/components/optiqueue/scheduler"
import { DEFAULT_DAY, TURNOVER_MINUTES } from "@/components/optiqueue/types"
import { SAMPLE_SURGERIES, SAMPLE_WEEKLY_SCHEDULE, SAMPLE_DAILY_CASES_WITH_CONFLICTS, PROCEDURE_NAMES, SURGEONS, EQUIPMENT, PRIORITY_LABELS, PRIORITY_COLORS, SAMPLE_AGGREGATES } from "@/components/optiqueue/sample-data"
import { predictDuration, slotOfDayFrom } from "@/components/optiqueue/predictor"
import { DropdownInput } from "@/components/optiqueue/dropdown-input"
import { filterDoctorsByProcedure, formatDoctorWithSpecializationLabels } from "@/components/optiqueue/specializations"
import { useMemo, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Stethoscope } from "lucide-react"

function AdminDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch("/api/auth/check-session")
      const data = await response.json()
      if (data.authenticated) {
        setUser(data.user)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/admin-login")
  }

  const handleGoToDoctorLogin = () => {
    router.push("/doctor-login")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header with Logout */}
      <header style={{
        background: "white",
        padding: "1rem 2rem",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, #20B2AA 0%, #1a9b96 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: "bold"
          }}>
            ⚕
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "#1a1a1a" }}>
              OptiQueue Admin Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#666", fontStyle: "italic" }}>
              Efficiency that Saves Lives
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {user && (
            <span style={{ color: "#666", fontSize: "0.9rem" }}>
              {user.email}
            </span>
          )}
          <button
            onClick={handleGoToDoctorLogin}
            style={{
              padding: "0.5rem 1rem",
              background: "#20B2AA",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
              transition: "opacity 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
          >
            Go to Doctor Login
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem 1rem",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
              transition: "opacity 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content - Reuse existing Control Tower from page.tsx */}
      <div className="control-tower-grid">
        <div className="control-tower-sidebar">
          <Suspense fallback={<div className="text-muted-foreground">Loading dashboard...</div>}>
            <ControlTowerSidebar />
          </Suspense>
        </div>
        <div className="control-tower-main">
          <Suspense fallback={<div className="text-muted-foreground">Loading dashboard...</div>}>
            <ControlTowerMain />
          </Suspense>
        </div>
      </div>
    </main>
  )
}

// Import ControlTowerSidebar and ControlTowerMain from the main page
function ControlTowerSidebar() {
  const { surgeries, setSurgeries } = useSurgeries()
  const { schedule, setSchedule, delayedIds, setDelayedIds } = useSchedule()
  const { weeklySchedule, setWeeklySchedule } = useWeeklySchedule()
  const { toast } = useToast()

  const onLoadSample = () => {
    setSurgeries(SAMPLE_SURGERIES)
    setSchedule(undefined)
    setWeeklySchedule(SAMPLE_WEEKLY_SCHEDULE)
    setDelayedIds(new Set())
    toast({ title: "Sample data loaded" })
  }

  const onLoadSampleConflicts = () => {
    const conflictSchedule = {
      optimized: {
        cases: SAMPLE_DAILY_CASES_WITH_CONFLICTS,
        idleMinutes: 200,
        overtimeMinutes: 30,
        waitCost: 2000,
      },
      baseline: {
        cases: SAMPLE_DAILY_CASES_WITH_CONFLICTS,
        idleMinutes: 300,
        overtimeMinutes: 60,
        waitCost: 3000,
      },
      kpis: {
        utilizationRate: 0.75,
        totalProjectedOvertime: 30,
        baselineUtilizationRate: 0.65,
        baselineOvertime: 60
      }
    }
    setSchedule(conflictSchedule)
    setWeeklySchedule(undefined)
    setDelayedIds(new Set())
    toast({ title: "Sample conflicts loaded" })
  }

  const onGenerate = () => {
    if (!surgeries.length) {
      toast({ title: "No surgeries", description: "Please add surgeries first", variant: "destructive" })
      return
    }
    const optimized = optimizeSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    const baseline = baselineSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    setSchedule({
      optimized,
      baseline,
      kpis: computeKPIs(optimized, baseline, DEFAULT_DAY),
    })
    setDelayedIds(new Set())
    toast({ title: "Schedule generated" })
  }

  return (
    <div className="space-y-6">
      <div className="control-tower-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
            <EmergencyIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">OptiQueue</h1>
            <p className="text-sm text-muted-foreground">Control Tower</p>
          </div>
        </div>
        <div className="space-y-2">
          <Link href="/doctor-login" className="block">
            <Button variant="default" className="w-full mb-2" size="lg">
              <Stethoscope className="w-4 h-4 mr-2" />
              Go to Doctor Login
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={onLoadSample} variant="secondary" className="flex-1">
              Load Sample Data
            </Button>
            <Button
              onClick={() => {
                setSurgeries([])
                setSchedule(undefined)
                setWeeklySchedule(undefined)
                setDelayedIds(new Set())
              }}
              variant="ghost"
            >
              Clear
            </Button>
          </div>
          <Button 
            onClick={onLoadSampleConflicts} 
            variant="outline" 
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            🚨 Load Sample Conflicts
          </Button>
        </div>
      </div>

      <div className="control-tower-card p-6 border-2 border-destructive/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-destructive/10">
            <EmergencyIcon className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-destructive">Emergency Case</h3>
            <p className="text-xs text-muted-foreground">Add urgent surgical case</p>
          </div>
        </div>
        <EmergencyInserter />
      </div>

      <div className="control-tower-card p-6">
        <h3 className="text-lg font-semibold mb-4">Case Management</h3>
        <Button className="w-full mt-4" onClick={onGenerate}>
          Generate Optimized Schedule
        </Button>
      </div>
    </div>
  )
}

function ControlTowerMain() {
  const { schedule, delayedIds } = useSchedule()
  const { weeklySchedule } = useWeeklySchedule()
  const conflicts = useMemo(() => {
    if (!schedule?.optimized?.cases) return []
    return detectConflicts(schedule.optimized.cases, TURNOVER_MINUTES)
  }, [schedule])

  return (
    <div className="space-y-6">
      <ControlTowerKPIs schedule={schedule} />
      {conflicts.length > 0 && <ConflictDisplay conflicts={conflicts} />}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule ? (
            <Gantt cases={schedule.optimized.cases} delayedIds={delayedIds} />
          ) : weeklySchedule ? (
            <Gantt cases={weeklySchedule.cases} delayedIds={delayedIds} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Load sample data or generate a schedule to view the Gantt chart
            </p>
          )}
        </CardContent>
      </Card>
      <VoiceAssistant />
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <SessionProtection requiredRole="admin" redirectTo="/admin-login">
      <AdminDashboardContent />
    </SessionProtection>
  )
}

