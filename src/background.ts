// Google API認証・カレンダー操作用 background script

let oauth2AccessToken = null
let oauth2TokenExpiry = null

const CLIENT_ID = process.env.PLASMO_PUBLIC_OAUTH_CLIENT_ID || ""
if (!CLIENT_ID) {
  throw new Error(
    "OAuth Client ID is not set. Please check your environment variables."
  )
}
const SCOPE = "https://www.googleapis.com/auth/calendar"
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`

async function authenticateAndGetToken() {
  return new Promise((resolve, reject) => {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&prompt=consent`
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          return reject(
            chrome.runtime.lastError?.message || "認証に失敗しました"
          )
        }
        // アクセストークンと有効期限をURLから抽出
        const m = redirectUrl.match(/[#&]access_token=([^&]*)/)
        const e = redirectUrl.match(/[#&]expires_in=([^&]*)/)
        if (m && m[1]) {
          oauth2AccessToken = m[1]
          if (e && e[1]) {
            oauth2TokenExpiry = Date.now() + parseInt(e[1], 10) * 1000
          } else {
            oauth2TokenExpiry = null
          }
          resolve(oauth2AccessToken)
        } else {
          reject("アクセストークンが取得できませんでした")
        }
      }
    )
  })
}

async function getValidAccessToken() {
  const isTokenExpired =
    !oauth2AccessToken || !oauth2TokenExpiry || Date.now() >= oauth2TokenExpiry
  if (!oauth2AccessToken || isTokenExpired) {
    const token = await authenticateAndGetToken()
    if (!token) throw new Error("アクセストークンを取得できませんでした。")
    return token
  }
  return oauth2AccessToken
}

async function getCalendarList() {
  const accessToken = await getValidAccessToken()
  const url = "https://www.googleapis.com/calendar/v3/users/me/calendarList"
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      "カレンダー一覧の取得中にエラーが発生しました。" + JSON.stringify(err)
    )
  }
  const data = await response.json()
  return data.items
}

async function createCalendarEvent({
  summary,
  description = "",
  startDateTime,
  endDateTime,
  timeZone = "Asia/Tokyo",
  recurrence = "",
  calendarId = "primary",
  location = ""
}) {
  const accessToken = await getValidAccessToken()
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  const event = {
    summary,
    description,
    start: {
      dateTime: startDateTime,
      timeZone
    },
    end: {
      dateTime: endDateTime,
      timeZone
    },
    ...(recurrence ? { recurrence } : {}),
    ...(location ? { location } : {})
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      "イベントの追加中にエラーが発生しました。" + JSON.stringify(err)
    )
  }
  return await response.json()
}

// イベント削除関数
async function deleteCalendarEvent(calendarId, eventId) {
  const accessToken = await getValidAccessToken()
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      "イベントの削除中にエラーが発生しました。" + JSON.stringify(err)
    )
  }
  return response.status === 204
}

// 特定の繰り返しイベントの単一インスタンスを削除する関数
async function deleteEventInstance(calendarId, eventId, instanceDate) {
  const accessToken = await getValidAccessToken()

  // 繰り返しイベントのインスタンスを取得
  const instanceUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}/instances?timeMin=${instanceDate}T00:00:00+09:00&timeMax=${instanceDate}T23:59:59+09:00`

  const instanceResponse = await fetch(instanceUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  })

  if (!instanceResponse.ok) {
    // インスタンスが見つからない場合は成功とみなす
    if (instanceResponse.status === 404) {
      return true
    }
    throw new Error("インスタンスの取得に失敗しました")
  }

  const instanceData = await instanceResponse.json()
  if (instanceData.items && instanceData.items.length > 0) {
    // 最初にマッチしたインスタンスを削除
    const instanceId = instanceData.items[0].id
    return await deleteCalendarEvent(calendarId, instanceId)
  }

  // インスタンスが見つからない場合は成功とみなす
  return true
}

// 祝日取得関数
async function getHolidays(timeMin, timeMax) {
  try {
    const accessToken = await getValidAccessToken()
    // 日本の祝日カレンダーID
    const holidayCalendarId = "ja.japanese#holiday@group.v.calendar.google.com"

    // まず、カレンダーリストに祝日カレンダーがあるかチェック
    const calendarListResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    )

    if (calendarListResponse.ok) {
      const calendarListData = await calendarListResponse.json()
      const hasHolidayCalendar = calendarListData.items?.some(
        (cal) => cal.id === holidayCalendarId
      )

      // 祝日カレンダーがカレンダーリストにない場合は追加を試行
      if (!hasHolidayCalendar) {
        try {
          await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                id: holidayCalendarId
              })
            }
          )
        } catch (addError) {
          // カレンダー追加に失敗した場合は継続（祝日なしで処理）
          console.warn("祝日カレンダーの追加に失敗しました:", addError)
        }
      }
    }

    // 祝日イベントを取得
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(holidayCalendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(
        "祝日の取得中にエラーが発生しました。" + JSON.stringify(err)
      )
    }

    const data = await response.json()
    return (
      data.items?.map((item) => ({
        date: item.start.date, // YYYY-MM-DD format
        summary: item.summary
      })) || []
    )
  } catch (error) {
    throw new Error("祝日の取得中にエラーが発生しました: " + error.message)
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CALENDAR_LIST") {
    getCalendarList()
      .then((items) => sendResponse({ success: true, items }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }
  if (message.type === "CREATE_CALENDAR_EVENT") {
    createCalendarEvent(message.event)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }
  if (message.type === "GET_HOLIDAYS") {
    getHolidays(message.timeMin, message.timeMax)
      .then((holidays) => sendResponse({ success: true, holidays }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }
  if (message.type === "DELETE_CALENDAR_EVENT") {
    deleteCalendarEvent(message.calendarId, message.eventId)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }
  if (message.type === "DELETE_EVENT_INSTANCE") {
    deleteEventInstance(
      message.calendarId,
      message.eventId,
      message.instanceDate
    )
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }
})
