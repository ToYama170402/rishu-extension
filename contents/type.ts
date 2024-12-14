type date = "月" | "火" | "水" | "木" | "金" | "土" | "日"
type period = number
export type yearQuoter = {
  year: number
  quoter: 1 | 2 | 3 | 4
}
export type datePeriod = {
  date: date
  period: period
}
export type course = {
  datePeriod: datePeriod
  yearQuoter: yearQuoter
  courseNumber: string
  courseName: string
  onClick: any
  classRoom: string
  instructor: string
  department: string
}
