import type { Holiday, ScheduleChange } from "./types"

// 時間割変更管理関数
export const addScheduleChange = (
  scheduleChanges: ScheduleChange[],
  date: string,
  fromDay: string,
  toDay: string,
  description?: string
): ScheduleChange[] => {
  const newChange: ScheduleChange = {
    id: Date.now().toString(),
    date,
    fromDay,
    toDay,
    description
  }
  return [...scheduleChanges, newChange]
}

export const removeScheduleChange = (
  scheduleChanges: ScheduleChange[],
  id: string
): ScheduleChange[] => {
  return scheduleChanges.filter((change) => change.id !== id)
}

// 指定された日付が祝日かチェック
export const isHoliday = (holidays: Holiday[], date: string): boolean => {
  return holidays.some((holiday) => holiday.date === date)
}

// 指定された日付の時間割変更をチェック
export const getScheduleChangeForDate = (
  scheduleChanges: ScheduleChange[],
  date: string
): ScheduleChange | null => {
  return scheduleChanges.find((change) => change.date === date) || null
}
