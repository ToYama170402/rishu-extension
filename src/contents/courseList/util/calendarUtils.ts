import { parseSyllabus } from "../../util/parseSyllabus"
import periodToTime from "../../util/periodToTime"
import { getScheduleChangeForDate, isHoliday } from "./scheduleChangeUtils"
import type { CourseInfo, Holiday, ScheduleChange } from "./types"

// イベント詳細生成
export const formatEventDetails = (course: CourseInfo): string => {
  let details = `担当教員: ${course.teacherName}\nシラバス: ${course.syllabusLink}`
  if (course.syllabus) {
    const s = course.syllabus
    const shortInfo = [
      s.subjectNumber && `科目ナンバー: ${s.subjectNumber}`,
      s.credits && `単位数: ${s.credits}`,
      s.lectureType && `講義形態: ${s.lectureType}`,
      s.dayPeriod && `曜日・時限: ${s.dayPeriod}`,
      s.term && `学期: ${s.term}`,
      s.room && `講義室: ${s.room}`,
      s.books &&
        s.books.length > 0 &&
        `教科書: ${s.books.map((b) => b.title).join(", ")}`
    ]
      .filter(Boolean)
      .join("\n")
    details += "\n" + shortInfo
  }
  return details
}

// シラバス取得
export const fetchAndParseSyllabus = async (
  course: CourseInfo
): Promise<CourseInfo> => {
  try {
    const res = await fetch(course.syllabusLink)
    const html = await res.text()
    const syllabus = parseSyllabus(html)
    return { ...course, syllabus }
  } catch {
    return { ...course, syllabus: null }
  }
}

// カレンダーイベント作成（RRULE版：祝日除外・時間割変更対応）
export const createCalendarEvent = async (
  course: CourseInfo,
  repeatStart: string,
  repeatEnd: string,
  calendarId: string,
  holidays: Holiday[],
  scheduleChanges: ScheduleChange[]
): Promise<void> => {
  const { startTime, endTime } = periodToTime(course.period)
  const location = course.syllabus?.room || ""

  // 最初の授業日を見つける
  const startDate = new Date(repeatStart)
  const endDate = new Date(repeatEnd)
  const targetDayNum = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0
  }[course.day]

  // 最初の該当曜日を見つける
  let firstOccurrence = new Date(startDate)
  while (firstOccurrence.getDay() !== targetDayNum) {
    firstOccurrence.setDate(firstOccurrence.getDate() + 1)
  }

  // RRULE用の曜日コード
  const dayCode = {
    0: "SU", // Sunday
    1: "MO", // Monday
    2: "TU", // Tuesday
    3: "WE", // Wednesday
    4: "TH", // Thursday
    5: "FR", // Friday
    6: "SA" // Saturday
  }[targetDayNum]

  // RRULEで繰り返しイベントを作成
  const startTimeStr = startTime.toTimeString().slice(0, 8)
  const endTimeStr = endTime.toTimeString().slice(0, 8)
  const firstOccurrenceStr = firstOccurrence.toISOString().slice(0, 10)
  const startDateTime = `${firstOccurrenceStr}T${startTimeStr}+09:00`
  const endDateTime = `${firstOccurrenceStr}T${endTimeStr}+09:00`
  const untilDate = endDate.toISOString().slice(0, 10).replace(/-/g, "")

  const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilDate}T235959Z`

  // 繰り返しイベントを作成
  const recurringEventResponse = await new Promise<any>((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "CREATE_CALENDAR_EVENT",
        event: {
          summary: `${course.courseName}`,
          description: formatEventDetails(course),
          startDateTime,
          endDateTime,
          timeZone: "Asia/Tokyo",
          recurrence: [rrule],
          calendarId,
          location
        }
      },
      (res) => resolve(res)
    )
  })

  if (!recurringEventResponse.success) {
    throw new Error("繰り返しイベントの作成に失敗しました")
  }

  const recurringEventId = recurringEventResponse.result.id

  // 祝日と時間割変更日のリストを作成
  const datesToDelete: string[] = []
  const scheduleChangesToAdd = []

  // 指定期間内の該当曜日の全日付を確認（元の授業日をチェック）
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDay = d.getDay()
    const dateStr = d.toISOString().slice(0, 10)

    // 該当曜日でない場合はスキップ
    if (currentDay !== targetDayNum) {
      continue
    }

    // 祝日チェック
    if (isHoliday(holidays, dateStr)) {
      datesToDelete.push(dateStr)
      continue
    }

    // 時間割変更チェック
    const scheduleChange = getScheduleChangeForDate(scheduleChanges, dateStr)
    if (scheduleChange) {
      datesToDelete.push(dateStr)
    }
  }

  // 時間割変更日の個別イベントを探す（変更先が元の曜日と一致する場合）
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    const scheduleChange = getScheduleChangeForDate(scheduleChanges, dateStr)

    if (scheduleChange) {
      // 変更先の曜日と現在の授業の曜日が一致する場合、個別イベントを作成
      const courseEnglishDay = course.day
      const courseDayNum = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 0
      }[courseEnglishDay]
      const changeToDayNum = {
        月: 1,
        火: 2,
        水: 3,
        木: 4,
        金: 5,
        土: 6,
        日: 0
      }[scheduleChange.toDay]

      if (changeToDayNum === courseDayNum) {
        scheduleChangesToAdd.push({
          date: dateStr,
          course,
          scheduleChange
        })
      }
    }
  }

  // 祝日と時間割変更日の個別インスタンスを削除
  for (const dateToDelete of datesToDelete) {
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "DELETE_EVENT_INSTANCE",
          calendarId,
          eventId: recurringEventId,
          instanceDate: dateToDelete
        },
        (res) => resolve()
      )
    })
    // API制限対策で少し待機
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // 時間割変更日の個別イベントを作成
  for (const change of scheduleChangesToAdd) {
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CREATE_CALENDAR_EVENT",
          event: {
            summary: `${change.course.courseName} (${change.scheduleChange.description || "時間割変更"})`,
            description:
              formatEventDetails(change.course) +
              `\n\n時間割変更: ${change.scheduleChange.description || ""}`,
            startDateTime: `${change.date}T${startTimeStr}+09:00`,
            endDateTime: `${change.date}T${endTimeStr}+09:00`,
            timeZone: "Asia/Tokyo",
            calendarId,
            location
          }
        },
        (res) => resolve()
      )
    })
    // API制限対策で少し待機
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
