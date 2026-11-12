export const runtime = 'edge'

import { NextResponse } from "next/server"
import { hashData } from "@/lib/hash"
import { executeQuery } from "@/lib/db"
import { getPrimaryFacebookPixelId } from "@/lib/pixels-db"

const envPixelList = (process.env.NEXT_PUBLIC_FB_PIXEL_IDS || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean)

const ALL_PIXEL_IDS = Array.from(new Set(envPixelList))
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN
const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_FB_TEST_EVENT_CODE

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { targetPixelId, eventName, eventUrl, eventId, customData, userData } = body

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

    // 5. Strict Multi-Account Pixel Isolation
    // Only send the event to the pixel dedicated to this product/campaign, or Admin Panel's Primary Pixel!
    let targetPixelIds: string[] = []
    if (targetPixelId && typeof targetPixelId === "string" && targetPixelId.trim().length > 4) {
      targetPixelIds = [targetPixelId.trim()]
    } else {
      const dbPrimaryPixel = await getPrimaryFacebookPixelId()
      if (dbPrimaryPixel) {
        targetPixelIds = [dbPrimaryPixel]
      } else if (ALL_PIXEL_IDS[0]) {
        targetPixelIds = [ALL_PIXEL_IDS[0]]
      }
    }

    if (targetPixelIds.length === 0) {
      return NextResponse.json({ success: true, eventId, skipped: "No active Meta pixel configured" })
    }

    await Promise.allSettled(
      targetPixelIds.map(async (pId) => {
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
      console.log(`[Meta CAPI] Successfully dispatched ${eventName} (ID: ${eventId}) to Pixel(s): ${targetPixelIds.join(', ')}`)
    }

    return NextResponse.json({ success: true, eventId })

  } catch (error: any) {
    console.error("[Meta CAPI] Internal Server Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
