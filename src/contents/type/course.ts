export type course = {
  dayPeriod: dayPeriods
  courseNumber: string
  courseName: string
  teacher: string
  courseType: string
  targetStudent: string
}

export type dayPeriods = (generalDayPeriod | "集中")[]

export type generalDayPeriod = {
  day: "月" | "火" | "水" | "木" | "金" | "土"
  period: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
}
