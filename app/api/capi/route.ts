export const runtime = 'edge'

import { NextResponse } from "next/server"
import { hashData } from "@/lib/hash"

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "1004524488604833"
const SECONDARY_PIXEL_ID = process.env.NEXT_PUBLIC_SECONDARY_FB_PIXEL_ID || "864520106659183"
const ALL_PIXEL_IDS = Array.from(new Set([PIXEL_ID, SECONDARY_PIXEL_ID].filter(Boolean)))
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN
const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_FB_TEST_EVENT_CODE

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { eventName, eventUrl, eventId, customData, userData } = body

    // 1. Check for Access Token
    if (!ACCESS_TOKEN) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Meta CAPI] Skipping server event: FB_ACCESS_TOKEN is not set.")
      }
      return NextResponse.json({ success: true, message: "Skipped (No Token)" })
    }

    if (!eventName || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 2. Extract Network Headers for Event Match Quality
    const headers = req.headers
    const client_ip_address = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "0.0.0.0"
    const client_user_agent = headers.get("user-agent") || ""

    // 3. Hash User Data (Advanced Matching)
    const hashedEmail = await hashData(userData?.email)
    const hashedPhone = await hashData(userData?.phone)
    const hashedFirstName = await hashData(userData?.firstName)
    const hashedLastName = await hashData(userData?.lastName)
    const formattedUserData: any = {
      client_ip_address,
      client_user_agent,
    }

    if (hashedEmail) formattedUserData.em = [hashedEmail]
    if (hashedPhone) formattedUserData.ph = [hashedPhone]
    if (hashedFirstName) formattedUserData.fn = [hashedFirstName]
    if (hashedLastName) formattedUserData.ln = [hashedLastName]
    if (userData?.external_id) formattedUserData.external_id = [userData.external_id]

    // 4. Construct CAPI Payload
    const eventPayload: any = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_id: eventId,
      event_source_url: eventUrl,
      user_data: formattedUserData,
      custom_data: customData,
    }

    const payload = {
      data: [eventPayload],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {})
    }

    // 5. Dispatch to Meta Graph API for all configured pixels
    await Promise.allSettled(
      ALL_PIXEL_IDS.map(async (pId) => {
        const metaUrl = `https://graph.facebook.com/v19.0/${pId}/events?access_token=${ACCESS_TOKEN}`
        try {
          const response = await fetch(metaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          const data = await response.json()
          if (!response.ok && process.env.NODE_ENV !== "production") {
            console.error(`[Meta CAPI] Error response for Pixel ${pId}:`, data)
          }
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.error(`[Meta CAPI] Network error for Pixel ${pId}:`, err)
          }
        }
      })
    )

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Meta CAPI] Successfully dispatched ${eventName} (ID: ${eventId})`)
    }

    return NextResponse.json({ success: true, eventId })

  } catch (error: any) {
    console.error("[Meta CAPI] Internal Server Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
