"use client"

import { Suspense } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/optiqueue/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Gantt } from "@/components/optiqueue/gantt"
import { ControlTowerKPIs } from "@/components/optiqueue/control-tower-kpis"
import { EmergencyInserter } from "@/components/optiqueue/emergency-inserter"
import { VoiceAssistant } from "@/components/optiqueue/voice-assistant"
import { EmergencyIcon } from "@/components/optiqueue/3d-icons"
import { OptiQueueLogo } from "@/components/optiqueue/optiqueue-logo"
import { ConflictDisplay } from "@/components/optiqueue/conflict-display"
import { ConflictAnalysisDashboard } from "@/components/optiqueue/conflict-analysis-dashboard"
import { detectConflicts } from "@/components/optiqueue/conflict-detector"
import { useSchedule, useSurgeries, useWeeklySchedule } from "@/components/optiqueue/store"
import { optimizeSchedule, computeKPIs, baselineSchedule } from "@/components/optiqueue/scheduler"
import { DEFAULT_DAY, TURNOVER_MINUTES } from "@/components/optiqueue/types"
import { SAMPLE_SURGERIES, SAMPLE_WEEKLY_SCHEDULE, SAMPLE_DAILY_CASES_WITH_CONFLICTS, PROCEDURE_NAMES, SURGEONS, EQUIPMENT, PRIORITY_LABELS, PRIORITY_COLORS, SAMPLE_AGGREGATES } from "@/components/optiqueue/sample-data"
import { UtilizationDashboard } from "@/components/optiqueue/utilization-dashboard"
import { predictDuration, slotOfDayFrom } from "@/components/optiqueue/predictor"
import { DropdownInput } from "@/components/optiqueue/dropdown-input"
import { filterDoctorsByProcedure, formatDoctorWithSpecializationLabels } from "@/components/optiqueue/specializations"
import { determineProcedurePriority, getPriorityLabel, getPriorityColor } from "@/components/optiqueue/priority-engine"
import { NotificationPanel } from "@/components/optiqueue/notifications/notification-panel"
import { SharePatientUpdates } from "@/components/optiqueue/notifications/share-patient-updates"
import { initializeSampleNotifications } from "@/components/optiqueue/notifications/sample-notifications"
import { useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Stethoscope, LogOut, User } from "lucide-react"
import { useAuth } from "@/components/optiqueue/auth/store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getPriorityClass(priority: number): string {
  switch (priority) {
    case 1:
      return "priority-emergency"
    case 2:
      return "priority-high"
    case 3:
      return "priority-medium"
    case 4:
      return "priority-low"
    case 5:
      return "priority-elective"
    default:
      return "priority-elective"
  }
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={["Administrator"]}>
      <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
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
    </ProtectedRoute>
  )
}

function ControlTowerSidebar() {
  const { surgeries, setSurgeries } = useSurgeries()
  const { schedule, setSchedule, delayedIds, setDelayedIds } = useSchedule()
  const { weeklySchedule, setWeeklySchedule } = useWeeklySchedule()
  const { user, logout } = useAuth()

  useEffect(() => {
    initializeSampleNotifications()
  }, [])

  const onLoadSample = () => {
    setSurgeries(SAMPLE_SURGERIES)
    setSchedule(undefined)
    setWeeklySchedule(SAMPLE_WEEKLY_SCHEDULE)
    setDelayedIds(new Set())
  }

  const onLoadSampleConflicts = () => {
    // Create a schedule with conflicts for demonstration
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
  }

  const onGenerate = () => {
    if (!surgeries.length) return
    const optimized = optimizeSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    const baseline = baselineSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    setSchedule({
      optimized,
      baseline,
      kpis: computeKPIs(optimized, baseline, DEFAULT_DAY),
    })
    setDelayedIds(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Control Tower Header */}
      <div className="control-tower-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <OptiQueueLogo className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">OptiQueue</h1>
              <p className="text-sm text-muted-foreground">Efficiency that saves lives</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification System */}
            <NotificationPanel />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@optiqueue.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* 1. QUICK ACTIONS - System Controls */}
        <div className="control-tower-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">Quick Actions</h3>
              <p className="text-xs text-blue-600">System controls and data management</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={onLoadSample} variant="secondary" className="flex-1">
                📊 Load Sample Data
              </Button>
              <Button
                onClick={() => {
                  setSurgeries([])
                  setSchedule(undefined)
                  setWeeklySchedule(undefined)
                  setDelayedIds(new Set())
                }}
                variant="outline"
                className="flex-1"
              >
                🗑️ Clear All
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
      </div>

      {/* 2. EMERGENCY OPERATIONS - Critical Priority */}
      <div className="control-tower-card p-6 border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-100">
            <EmergencyIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-700">Emergency Case Insertion</h3>
            <p className="text-xs text-red-600">Add urgent surgical cases with priority override</p>
          </div>
        </div>
        <EmergencyInserter />
      </div>

      {/* 3. INTELLIGENT PLANNING - AI-Powered Predictions */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-200">
        <TimePredictionSection />
      </div>

      {/* 4. CASE MANAGEMENT - Standard Operations */}
      <div className="control-tower-card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-100">
            <span className="text-2xl">📝</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-800">Case Management</h3>
            <p className="text-xs text-green-600">Add and manage surgical procedures</p>
          </div>
        </div>
        <AddCaseForm />
        <div className="mt-4 p-3 bg-green-100/50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-green-700">⏱️</span>
            <p className="text-sm text-green-700">
              Standard turnover time: <span className="font-semibold">{TURNOVER_MINUTES} minutes</span>
            </p>
          </div>
        </div>
        <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={onGenerate}>
          🎯 Generate Optimized Schedule
        </Button>
      </div>
    </div>
  )
}

function ControlTowerMain() {
  const { schedule, delayedIds } = useSchedule()
  const { weeklySchedule } = useWeeklySchedule()
  const [isWeeklyView, setIsWeeklyView] = useState(false)

  // Detect conflicts in current schedule
  const currentCases = schedule?.optimized.cases || weeklySchedule?.optimized.cases || []
  const conflictAnalysis = detectConflicts(currentCases)

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE OVERVIEW - Key Performance Indicators */}
      <div className="control-tower-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-100">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-800">Executive Dashboard</h2>
            <p className="text-xs text-blue-600">Real-time performance metrics and system status</p>
          </div>
        </div>
        <ControlTowerKPIs />
      </div>

      {/* 2. OPERATIONAL ANALYTICS - Utilization Dashboard */}
      <UtilizationDashboard />

      {/* 3. CONFLICT ANALYSIS - Critical Alerts */}
      <ConflictAnalysisDashboard 
        conflicts={conflictAnalysis}
        onResolveConflicts={() => {
          console.log("Resolving conflicts...")
        }}
      />

      {/* 4. REAL-TIME VISUALIZATION - Surgical Timeline */}
      <div className="control-tower-card p-6 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {isWeeklyView ? "Weekly Surgical Timeline" : "Live Surgical Timeline"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isWeeklyView ? "07:00 - 17:00 across 7 days" : "Real-time view across 5 Operating Theaters"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Share Updates Button */}
            <SharePatientUpdates />
            
            {/* View Toggle Buttons */}
            <div className="flex gap-2">
              <Button
                variant={!isWeeklyView ? "default" : "outline"}
                size="sm"
                onClick={() => setIsWeeklyView(false)}
                className="px-4"
              >
                📅 Daily View
              </Button>
              <Button
                variant={isWeeklyView ? "default" : "outline"}
                size="sm"
                onClick={() => setIsWeeklyView(true)}
                className="px-4"
              >
                📆 Weekly View
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-4 border border-primary/10">
          <Gantt delayedIds={delayedIds} isWeekly={isWeeklyView} />
        </div>
      </div>

      {/* 5. DETAILED CASE INFORMATION - Cases Table */}
      <div className="control-tower-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Scheduled Cases Overview</h3>
            <p className="text-sm text-muted-foreground">Detailed case information and status tracking</p>
          </div>
        </div>
        <CasesTable />
      </div>
    </div>
  )
}

function TimePredictionSection() {
  const [doctor, setDoctor] = useState("")
  const [surgeryType, setSurgeryType] = useState("")
  const [estMin, setEstMin] = useState(60)
  const [patientReady, setPatientReady] = useState("07:30")
  const [equipment, setEquipment] = useState("C-Arm")
  const [prediction, setPrediction] = useState<{ predMin: number; explain: string; conf: "low" | "med" | "high"; factors: Record<string, number>; deltaVsEstimate: number } | null>(null)
  const [exampleCollapsed, setExampleCollapsed] = useState(false)
  const { toast } = useToast()
  
  // Filter doctors based on selected procedure
  const availableDoctors = useMemo(() => {
    return filterDoctorsByProcedure(SURGEONS, surgeryType)
  }, [surgeryType])
  
  // Create labels for doctor dropdown (with specializations)
  const doctorLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    availableDoctors.forEach(doc => {
      labels[doc] = formatDoctorWithSpecializationLabels(doc)
    })
    return labels
  }, [availableDoctors])
  
  // Clear doctor selection if current doctor is not available for new procedure
  useEffect(() => {
    if (surgeryType && doctor && !availableDoctors.includes(doctor)) {
      setDoctor("")
    }
  }, [surgeryType, doctor, availableDoctors])

  const handlePredict = () => {
    if (!doctor || !surgeryType) {
      toast({ title: "Missing information", description: "Please select both doctor and surgery type", variant: "destructive" })
      return
    }

    const out = predictDuration(
      {
        procedureCode: surgeryType,
        estMin,
        surgeonId: doctor,
        equipmentIds: [equipment],
        patientReady: patientReady as any,
      },
      SAMPLE_AGGREGATES,
    )
    const deltaVsEstimate = out.predMin - estMin
    setPrediction({ ...out, deltaVsEstimate })
    setExampleCollapsed(false)
    toast({ title: "Prediction generated", description: `${out.predMin} minutes (${out.conf.toUpperCase()} efficiency)` })
  }

  // Get detailed stats for worked example
  const getWorkedExampleDetails = () => {
    if (!prediction || !surgeryType || !doctor) return null
    
    const ps = SAMPLE_AGGREGATES.proc[surgeryType]
    const sStats = SAMPLE_AGGREGATES.procSurgeon[surgeryType]?.[doctor]
    const eStats = SAMPLE_AGGREGATES.procEquip[surgeryType]?.[equipment]
    const slot = slotOfDayFrom(patientReady)
    const tStats = SAMPLE_AGGREGATES.procTOD[surgeryType]?.[slot]
    
    return {
      procMed: ps?.med ?? 0,
      procN: ps?.n ?? 0,
      sDelta: sStats?.med ?? 0,
      sN: sStats?.n ?? 0,
      eDelta: eStats?.med ?? 0,
      eN: eStats?.n ?? 0,
      tDelta: tStats?.med ?? 0,
      tN: tStats?.n ?? 0,
      slot,
    }
  }

  const details = getWorkedExampleDetails()
  const confColor = prediction?.conf === "high" ? "bg-emerald-600" : prediction?.conf === "med" ? "bg-amber-500" : "bg-slate-500"

  return (
    <div className="control-tower-card p-6 border-2 border-primary/20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-2 sm:p-3 flex-shrink-0">
            <span className="text-xl sm:text-2xl">🧠</span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">Smart Duration Predictor</h4>
            <p className="text-blue-100 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">AI-powered surgical time estimation</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Doctor</label>
            <DropdownInput
              name="doctor"
              placeholder={surgeryType ? "Select doctor" : "Select surgery type first"}
              options={availableDoctors}
              value={doctor}
              onChange={setDoctor}
              disabled={!surgeryType || availableDoctors.length === 0}
              optionLabels={doctorLabels}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Surgery Type</label>
            <DropdownInput
              name="surgeryType"
              placeholder="Select surgery type"
              options={PROCEDURE_NAMES}
              value={surgeryType}
              onChange={setSurgeryType}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Base Estimate (min)</label>
            <Input
              type="number"
              min={15}
              step={5}
              value={estMin}
              onChange={(e) => setEstMin(Number(e.target.value))}
              placeholder="Base estimate"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Patient Ready</label>
            <Input
              type="text"
              value={patientReady}
              onChange={(e) => setPatientReady(e.target.value)}
              placeholder="HH:MM"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Equipment</label>
          <DropdownInput
            name="equipment"
            placeholder="Select equipment"
            options={EQUIPMENT}
            value={equipment}
            onChange={setEquipment}
          />
        </div>

        <Button onClick={handlePredict} className="w-full" variant="default">
          Predict Duration
        </Button>

        {prediction && details && (
          <div className="mt-6 overflow-hidden rounded-2xl border-2 border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-xl">
            {/* Header Section */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Predicted Time</h3>
                    <p className="text-xs text-muted-foreground">Surgery duration with explainable breakdown</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExampleCollapsed((prev) => !prev)}
                  className="text-gray-700 hover:bg-gray-200 border border-gray-300 px-2 sm:px-4 flex-shrink-0"
                >
                  <span className="hidden sm:inline">{exampleCollapsed ? "📊 View Analysis" : "📋 Hide Analysis"}</span>
                  <span className="sm:hidden">{exampleCollapsed ? "📊" : "📋"}</span>
                </Button>
              </div>
            </div>

            {/* Main Result Section */}
            <div className="px-6 py-6 bg-white/90 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Primary Result */}
                <div className="lg:col-span-2">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200">
                      <span className="text-2xl">⏱️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Estimated Surgery Time</p>
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {prediction.predMin}
                      </div>
                      <p className="text-lg text-gray-500 font-medium">minutes</p>
                      
                      {prediction.deltaVsEstimate !== 0 && (
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-3 ${
                          prediction.deltaVsEstimate > 0 
                            ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          <span>{prediction.deltaVsEstimate >= 0 ? "📈" : "📉"}</span>
                          {prediction.deltaVsEstimate >= 0 ? "+" : ""}{prediction.deltaVsEstimate} min adjustment
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Efficiency Badge */}
                <div className="flex items-center justify-center">
                  <div className={`rounded-2xl px-8 py-6 text-center shadow-xl border-2 ${confColor} text-white transform hover:scale-105 transition-transform`}>
                    <div className="text-3xl mb-2">
                      {prediction.conf === 'high' ? '🟢' : prediction.conf === 'medium' ? '🟡' : '🔴'}
                    </div>
                    <div className="font-bold text-xl mb-1">{prediction.conf.toUpperCase()}</div>
                    <div className="text-sm opacity-90 font-medium">Confidence</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis Section */}
            {!exampleCollapsed && (
              <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="px-6 py-6 space-y-6">
                  {/* Surgery Details */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <span className="text-xl">📋</span>
                      </div>
                      <h5 className="font-bold text-gray-800 text-lg">Surgery Details</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Procedure</span>
                          <span className="font-bold text-blue-700">{surgeryType}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Initial Estimate</span>
                          <span className="font-bold text-gray-800">{estMin} min</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Surgeon</span>
                          <span className="font-bold text-green-700">{doctor}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Equipment</span>
                          <span className="font-bold text-purple-700">{equipment}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Patient Status</span>
                          <span className="font-bold text-blue-700">{patientReady}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Risk Level</span>
                          <span className="font-bold text-green-700">✅ Low Risk</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Factors */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-green-100">
                        <span className="text-xl">🤖</span>
                      </div>
                      <h5 className="font-bold text-gray-800 text-lg">AI Analysis Factors</h5>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-blue-800">📊 Historical Base</div>
                          <div className="font-bold text-blue-900">{Math.round(prediction.factors.base)} min</div>
                        </div>
                        <div className="text-sm text-blue-700">
                          Based on {details.procN} similar {surgeryType} procedures (median: {Math.round(details.procMed)} min)
                        </div>
                      </div>
                      
                      {details.sN > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-green-800">👨‍⚕️ Surgeon Performance</div>
                            <div className="font-bold text-green-900">{prediction.factors.S >= 0 ? "+" : ""}{Math.round(prediction.factors.S)} min</div>
                          </div>
                          <div className="text-sm text-green-700">
                            {doctor}'s efficiency based on {details.sN} previous surgeries
                          </div>
                        </div>
                      )}
                      
                      {details.eN > 0 && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-purple-800">🔧 Equipment Impact</div>
                            <div className="font-bold text-purple-900">{prediction.factors.E >= 0 ? "+" : ""}{Math.round(prediction.factors.E)} min</div>
                          </div>
                          <div className="text-sm text-purple-700">
                            {equipment} usage efficiency from {details.eN} cases
                          </div>
                        </div>
                      )}
                      
                      {details.tN > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-orange-800">⏰ Time Slot Effect</div>
                            <div className="font-bold text-orange-900">{prediction.factors.T >= 0 ? "+" : ""}{Math.round(prediction.factors.T)} min</div>
                          </div>
                          <div className="text-sm text-orange-700">
                            {details.slot} scheduling impact from {details.tN} similar slots
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4 border-2 border-gray-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-800">🎯 Final Prediction</div>
                          <div className="font-bold text-gray-900 text-lg">{prediction.predMin} min</div>
                        </div>
                        <div className="text-sm text-gray-700">
                          Calculated with confidence bounds (L={Math.round(prediction.factors.L)}, U={Math.round(prediction.factors.U)})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <span className="text-xl">⚙️</span>
                      </div>
                      <h5 className="font-bold text-gray-800 text-lg">Technical Output</h5>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 overflow-x-auto border border-gray-300">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-400 text-xs ml-2">OptiQueue API Response</span>
                      </div>
                      <pre className="text-green-400 text-sm font-mono leading-relaxed">
{`{
  "predictedDuration": ${prediction.predMin},
  "adjustment": "${prediction.deltaVsEstimate >= 0 ? "+" : ""}${prediction.deltaVsEstimate} minutes",
  "confidence": "${prediction.conf}",
  "explanation": "${prediction.explain}",
  "status": "success"
}`}
                      </pre>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <span className="text-blue-600">💡</span>
                        <span className="font-medium">Pro Tip:</span>
                        <span>Hover over timeline elements for detailed breakdowns</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddCaseForm() {
  const { addCase } = useSurgeries()
  const [formData, setFormData] = useState({
    caseId: "",
    name: "",
    duration: 60,
    surgeon: "",
    equipment: "",
    priority: 3
  })
  const [priorityInfo, setPriorityInfo] = useState<{
    priority: number
    reason: string
    urgencyFactors: string[]
    confidence: 'high' | 'medium' | 'low'
  } | null>(null)
  const [predInfo, setPredInfo] = useState<{ value: number; explain: string; conf: string } | null>(null)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Filter doctors based on selected procedure
  const availableDoctors = useMemo(() => {
    return filterDoctorsByProcedure(SURGEONS, formData.name)
  }, [formData.name])
  
  // Create labels for doctor dropdown (with specializations)
  const doctorLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    availableDoctors.forEach(doctor => {
      labels[doctor] = formatDoctorWithSpecializationLabels(doctor)
    })
    return labels
  }, [availableDoctors])
  
  // Automatically determine priority when procedure changes
  useEffect(() => {
    if (formData.name) {
      const priorityData = determineProcedurePriority(formData.name)
      setPriorityInfo(priorityData)
      setFormData(prev => ({ ...prev, priority: priorityData.priority }))
      
      // Show toast notification about priority assignment
      toast({
        title: `Priority assigned: ${getPriorityLabel(priorityData.priority as 1 | 2 | 3 | 4 | 5)}`,
        description: priorityData.reason,
        variant: "default",
      })
    } else {
      setPriorityInfo(null)
      setFormData(prev => ({ ...prev, priority: 3 }))
    }
  }, [formData.name, toast])

  // Clear surgeon selection if current surgeon is not available for new procedure
  useEffect(() => {
    if (formData.name && formData.surgeon && !availableDoctors.includes(formData.surgeon)) {
      setFormData(prev => ({ ...prev, surgeon: "" }))
      toast({
        title: "Surgeon cleared",
        description: "Selected surgeon is not available for this procedure. Please select a different surgeon.",
        variant: "default",
      })
    }
  }, [formData.name, formData.surgeon, availableDoctors, toast])

  // Efficiency color mapping
  const confTone = useMemo(() => {
    if (!predInfo) return { className: "bg-muted text-foreground", label: "" }
    if (predInfo.conf === "high") return { className: "bg-emerald-600 text-white", label: "High" }
    if (predInfo.conf === "med") return { className: "bg-amber-500 text-white", label: "Med" }
    return { className: "bg-slate-500 text-white", label: "Low" }
  }, [predInfo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = formData.caseId.trim() || `S-${Math.floor(Math.random() * 900 + 100)}`
    const name = formData.name.trim() || "Elective Case"
    const duration = Math.max(15, formData.duration)
    const surgeon = formData.surgeon.trim() || "Dr. Rajesh Kumar"
    const equipment = formData.equipment.trim() || "C-Arm"
    const priority = Math.min(5, Math.max(1, formData.priority))
    
    addCase({
      id,
      name,
      durationMinutes: duration,
      surgeon,
      equipment,
      priority: priority as 1 | 2 | 3 | 4 | 5,
    })
    
    // Reset form
    setFormData({
      caseId: "",
      name: "",
      duration: 60,
      surgeon: "",
      equipment: "",
      priority: 3
    })
    setPredInfo(null)
    setPriorityInfo(null)
  }

  const onPredict = () => {
    const estMin = Math.max(15, formData.duration)
    const out = predictDuration(
      {
        procedureCode: formData.name || "Hip Replacement",
        estMin,
        surgeonId: formData.surgeon || "Dr. Rajesh Kumar",
        equipmentIds: formData.equipment ? [formData.equipment] : ["C-Arm"],
        patientReady: "07:30",
      },
      SAMPLE_AGGREGATES,
    )
    setFormData((prev) => ({ ...prev, duration: out.predMin }))
    setPredInfo({ value: out.predMin, explain: out.explain, conf: out.conf })
    toast({ title: `Applied prediction: ${out.predMin} min (${out.conf.toUpperCase()})`, description: out.explain })
  }

  // Live preview (debounced) – recompute predInfo when inputs change, without changing duration
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const estMin = Math.max(15, formData.duration)
      const out = predictDuration(
        {
          procedureCode: formData.name || "Hip Replacement",
          estMin,
          surgeonId: formData.surgeon || "Dr. Rajesh Kumar",
          equipmentIds: formData.equipment ? [formData.equipment] : ["C-Arm"],
          patientReady: "07:30",
        },
        SAMPLE_AGGREGATES,
      )
      setPredInfo({ value: out.predMin, explain: out.explain, conf: out.conf })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [formData.name, formData.surgeon, formData.equipment, formData.duration])

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
      <Input 
        name="caseId" 
        placeholder="Case ID (optional)" 
        className="col-span-2"
        value={formData.caseId}
        onChange={(e) => setFormData(prev => ({ ...prev, caseId: e.target.value }))}
      />
      <DropdownInput
        name="name"
        placeholder="Procedure name"
        options={PROCEDURE_NAMES}
        value={formData.name}
        onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
        className="col-span-2"
      />
      <div className="flex items-center gap-2">
        <Input 
          name="duration" 
          type="number" 
          min={15} 
          step={5} 
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
          placeholder="Duration (min)" 
        />
        {predInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`${confTone.className} whitespace-nowrap`}>{predInfo.value} min • {confTone.label}</Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                {predInfo.explain}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <DropdownInput
        name="surgeon"
        placeholder={formData.name ? "Select Surgeon" : "Select Procedure first"}
        options={availableDoctors}
        value={formData.surgeon}
        onChange={(value) => setFormData(prev => ({ ...prev, surgeon: value }))}
        disabled={!formData.name || availableDoctors.length === 0}
        optionLabels={doctorLabels}
      />
      <DropdownInput
        name="equipment"
        placeholder="Required Equipment"
        options={EQUIPMENT}
        value={formData.equipment}
        onChange={(value) => setFormData(prev => ({ ...prev, equipment: value }))}
        className="col-span-2"
      />
      {/* Auto-assigned Priority Display */}
      <div className="col-span-2">
        {priorityInfo ? (
          <div className="p-3 rounded-lg border" style={{ 
            backgroundColor: `${getPriorityColor(priorityInfo.priority as 1 | 2 | 3 | 4 | 5)}15`,
            borderColor: getPriorityColor(priorityInfo.priority as 1 | 2 | 3 | 4 | 5)
          }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getPriorityColor(priorityInfo.priority as 1 | 2 | 3 | 4 | 5) }}
                />
                <span className="font-semibold text-sm">
                  Priority {priorityInfo.priority} - {getPriorityLabel(priorityInfo.priority as 1 | 2 | 3 | 4 | 5)}
                </span>
                <Badge variant={priorityInfo.confidence === 'high' ? 'default' : priorityInfo.confidence === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                  {priorityInfo.confidence} confidence
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{priorityInfo.reason}</p>
            {priorityInfo.urgencyFactors.length > 0 && (
              <div className="text-xs">
                <span className="font-medium">Key factors: </span>
                <span className="text-muted-foreground">{priorityInfo.urgencyFactors.join(', ')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-dashed border-muted-foreground/30 text-center">
            <span className="text-sm text-muted-foreground">Priority will be assigned automatically based on procedure type</span>
          </div>
        )}
      </div>
      <div className="col-span-2 flex gap-2 items-center">
        <Button type="button" variant="outline" onClick={onPredict}>
          Apply prediction
        </Button>
        <Button type="submit" className="flex-1">
        Add Case
        </Button>
      </div>
      {predInfo && (
        <div className="col-span-2 text-xs text-muted-foreground mt-1">
          <span className="font-medium">Preview:</span> {predInfo.value} min • {predInfo.conf.toUpperCase()} — hover badge for details
        </div>
      )}
    </form>
  )
}

function CasesTable() {
  const { surgeries, removeCase } = useSurgeries()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Case List</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="py-2 pr-2">Case</th>
              <th className="py-2 pr-2">Priority</th>
              <th className="py-2 pr-2">Duration</th>
              <th className="py-2 pr-2">Surgeon</th>
              <th className="py-2 pr-2">Equipment</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {surgeries.map((s) => {
              const priorityLabel = PRIORITY_LABELS[s.priority as keyof typeof PRIORITY_LABELS] || "Unknown"
              const priorityClass = getPriorityClass(s.priority)
              return (
                <tr key={s.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 pr-2">
                    <div className="font-medium">{s.id}</div>
                    <div className="text-sm text-muted-foreground">{s.name}</div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${priorityClass} shadow-sm`}></div>
                      <span className="text-sm font-medium">{s.priority} - {priorityLabel}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <span className="font-medium">{s.durationMinutes} min</span>
                  </td>
                  <td className="py-3 pr-2">
                    <span className="text-sm">{s.surgeon}</span>
                  </td>
                  <td className="py-3 pr-2">
                    <span className="text-sm">{s.equipment}</span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => removeCase(s.id)} className="text-destructive hover:text-destructive">
                      Remove
                    </Button>
                  </td>
                </tr>
              )
            })}
            {!surgeries.length && (
              <tr>
                <td colSpan={6} className="text-muted-foreground py-6">
                  No cases yet. Load sample or add cases.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
