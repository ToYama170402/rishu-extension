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

// 祝日取得関数
async function getHolidays(timeMin, timeMax) {
  const accessToken = await getValidAccessToken()
  // 日本の祝日カレンダーID
  const holidayCalendarId = "ja.japanese#holiday@group.v.calendar.google.com"
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(holidayCalendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
  
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
  return data.items?.map(item => ({
    date: item.start.date, // YYYY-MM-DD format
    summary: item.summary
  })) || []
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
})
