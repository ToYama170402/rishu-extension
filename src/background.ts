// Google API認証・カレンダー操作用 background script

let oauth2AccessToken = null
let oauth2TokenExpiry = null

async function authenticateAndGetToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError.message)
      }
      if (!token) {
        return reject("No access token found.")
      }
      oauth2AccessToken = token
      resolve(token)
    })
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
  description,
  startDateTime,
  endDateTime,
  timeZone = "Asia/Tokyo",
  recurrence,
  calendarId = "primary"
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
    ...(recurrence ? { recurrence } : {})
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
})
