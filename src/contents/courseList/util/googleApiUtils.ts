import type { CalendarItem, Holiday } from "./types"

// カレンダーリスト取得
export const fetchAndSetWritableCalendars = (): Promise<CalendarItem[]> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_CALENDAR_LIST" }, (res) => {
      if (res && res.success && res.items) {
        const writable = res.items.filter(
          (cal: CalendarItem) =>
            cal.accessRole === "writer" || cal.accessRole === "owner"
        )
        resolve(writable)
      } else {
        resolve([])
      }
    })
  })
}

// 祝日取得
export const fetchHolidays = (
  startDate: string,
  endDate: string
): Promise<Holiday[]> => {
  return new Promise((resolve) => {
    const timeMin = `${startDate}T00:00:00+09:00`
    const timeMax = `${endDate}T23:59:59+09:00`

    chrome.runtime.sendMessage(
      { type: "GET_HOLIDAYS", timeMin, timeMax },
      (res) => {
        if (res && res.success && res.holidays) {
          resolve(res.holidays)
        } else {
          resolve([])
        }
      }
    )
  })
}
