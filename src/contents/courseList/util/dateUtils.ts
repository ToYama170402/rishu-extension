// 曜日→BYDAY変換
export const getByDay = (day: string): string => {
  const dayMap = {
    Mon: "MO",
    Tue: "TU",
    Wed: "WE",
    Thu: "TH",
    Fri: "FR",
    Sat: "SA"
  }
  return dayMap[day] || ""
}

// 曜日から最初の日付を取得
export const getFirstDateOfWeekday = (
  startDateStr: string,
  weekdayStr: string
): string => {
  const dayMapNum = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const startDate = new Date(startDateStr)
  const startDay = startDate.getDay() === 0 ? 7 : startDate.getDay()
  const targetDay = dayMapNum[weekdayStr]
  const diff = (targetDay - startDay + 7) % 7
  const firstDate = new Date(startDate)
  firstDate.setDate(startDate.getDate() + diff)
  return firstDate.toISOString().slice(0, 10)
}

// 日本語曜日から英語曜日への変換
export const convertJapaneseDayToEnglish = (jpDay: string): string => {
  const dayConversion = {
    月: "Mon",
    火: "Tue",
    水: "Wed",
    木: "Thu",
    金: "Fri",
    土: "Sat",
    日: "Sun"
  }
  return dayConversion[jpDay] || jpDay
}
