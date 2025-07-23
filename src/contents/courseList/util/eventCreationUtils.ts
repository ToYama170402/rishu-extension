import { delay } from "../../../util/delay"
import { createCalendarEvent, fetchAndParseSyllabus } from "./calendarUtils"
import { fetchHolidays } from "./googleApiUtils"
import type { CourseInfo, Holiday, ScheduleChange } from "./types"

// イベント一括追加
export const fetchAndCreateEvents = async (
  courseInfoList: CourseInfo[],
  repeatStart: string,
  repeatEnd: string,
  calendarId: string,
  scheduleChanges: ScheduleChange[],
  setProgress: (progress: number) => void
): Promise<void> => {
  if (!repeatStart || !repeatEnd || !calendarId) {
    throw new Error("カレンダー、開始日、終了日をすべて入力してください。")
  }

  // まず祝日情報を取得
  const holidays = await fetchHolidays(repeatStart, repeatEnd)

  // 祝日取得の完了を少し待つ
  await delay(1000)

  const courseListWithSyllabus: CourseInfo[] = []
  for (let i = 0; i < courseInfoList.length; i++) {
    await delay(300 + Math.random() * 200)
    courseListWithSyllabus.push(await fetchAndParseSyllabus(courseInfoList[i]))
    setProgress(Math.round(((i + 1) / courseInfoList.length) * 100))
  }

  await Promise.all(
    courseListWithSyllabus.map((course) =>
      createCalendarEvent(
        course,
        repeatStart,
        repeatEnd,
        calendarId,
        holidays,
        scheduleChanges
      )
    )
  )
}
