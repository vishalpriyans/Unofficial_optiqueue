import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question, schedule, surgeries, nowMinute } = body || {}

  const context = JSON.stringify({ schedule, surgeries, nowMinute }).slice(0, 14_000) // keep prompt reasonable
  const prompt = [
    "You are OptiQueue's OR schedule assistant.",
    "Answer concisely in one or two sentences using the provided schedule JSON.",
    "Times are minutes since 07:00 for the current day. Convert to human-readable times.",
    "If asked about an OT, report the current case and estimated time remaining. If none, say idle.",
    "If asked about a surgeon, report when they are free considering cleanup/turnover of 30 minutes.",
    "If uncertain, say you are not certain rather than making up information.",
    "",
    "Question:",
    question || "",
    "",
    "Schedule Context JSON:",
    context,
  ].join("\n")

  const { text } = await generateText({
    model: "openai/gpt-5-mini",
    prompt,
  })

  return NextResponse.json({ text })
}
