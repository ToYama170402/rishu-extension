import type { parseSyllabus } from "../../util/parseSyllabus"

// シラバス情報の型定義
export type SyllabusInfo = ReturnType<typeof parseSyllabus>

// カレンダーアイテムの型定義
export type CalendarItem = {
  id: string
  summary: string
  accessRole?: string
}

// コース情報の型定義
export type CourseInfo = {
  day: string
  period: number
  syllabusLink: string
  courseName: string
  teacherName: string
  syllabus?: SyllabusInfo | null
}

// 時間割変更関連の型定義
export type ScheduleChange = {
  id: string
  date: string // YYYY-MM-DD format
  fromDay: string // 元の曜日（月、火、水、木、金、土、日）
  toDay: string // 変更先の曜日（月、火、水、木、金、土、日）
  description?: string // 変更内容の説明
}

// 祝日の型定義
export type Holiday = {
  date: string // YYYY-MM-DD format
  summary: string
}
