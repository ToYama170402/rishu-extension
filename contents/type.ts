export type datePeriod = {
  date: "月" | "火" | "水" | "木" | "金" | "土" | "日"
  period: number
}
export type yearQuoter = {
  year: number
  quoter: 1 | 2 | 3 | 4
}
export type course = {
  yearQuoter: yearQuoter
  datePeriod: datePeriod
  courseNumber: string
  courseName: string
  onClick: any
  classRoom: string
  instructor: string
  department: string
}
