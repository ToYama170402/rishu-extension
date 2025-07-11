import {
  Action as AlertDialogAction,
  Content as AlertDialogContent,
  Description as AlertDialogDescription,
  Overlay as AlertDialogOverlay,
  Root as AlertDialogRoot,
  Title as AlertDialogTitle
} from "@radix-ui/react-alert-dialog"
import * as Dialog from "@radix-ui/react-dialog"
import * as Progress from "@radix-ui/react-progress"
import cssText from "data-text:@/style.css"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import React, { useCallback, useMemo, useState } from "react"

import { parseSyllabus } from "../util/parseSyllabus"
import periodToTime from "../util/periodToTime"

// 型定義
export type SyllabusInfo = ReturnType<typeof parseSyllabus>
export type CalendarItem = { id: string; summary: string; accessRole?: string }
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

export type Holiday = {
  date: string // YYYY-MM-DD format
  summary: string
}

export const config: PlasmoCSConfig = {
  matches: [
    "https://eduweb.sta.kanazawa-u.ac.jp/Portal/StudentApp/Regist/RegistList.aspx"
  ]
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
  element: document.querySelector("#ctl00_phContents_tbBtnPdf")!,
  insertPosition: "afterend"
})

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// 時間割変更追加フォームコンポーネント
function ScheduleChangeForm({
  onAdd,
  disabled,
  existingChanges,
  semesterStart,
  semesterEnd
}: {
  onAdd: (
    date: string,
    fromDay: string,
    toDay: string,
    description?: string
  ) => void
  disabled: boolean
  existingChanges?: ScheduleChange[]
  semesterStart?: string
  semesterEnd?: string
}) {
  const [date, setDate] = useState("")
  const [toDay, setToDay] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !toDay) return

    // 重複チェック
    if (existingChanges?.some((change) => change.date === date)) {
      setError("この日付は既に設定されています")
      return
    }

    // 期間チェック
    if (semesterStart && date < semesterStart) {
      setError("開始日より前の日付は設定できません")
      return
    }
    if (semesterEnd && date > semesterEnd) {
      setError("終了日より後の日付は設定できません")
      return
    }

    const fromDay = new Date(date).toLocaleDateString("ja-JP", {
      weekday: "long"
    })
    onAdd(date, fromDay, toDay, description || undefined)
    setDate("")
    setToDay("")
    setDescription("")
    setError("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-32 flex-1">
          <label className="block text-xs text-gray-700">日付:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-none border border-gray-400 bg-white px-1 py-0.5 text-xs focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200"
            disabled={disabled}
            required
          />
        </div>
        <div className="min-w-20 flex-1">
          <label className="block text-xs text-gray-700">変更先曜日:</label>
          <select
            value={toDay}
            onChange={(e) => setToDay(e.target.value)}
            className="w-full rounded-none border border-gray-400 bg-white px-1 py-0.5 text-xs focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200"
            disabled={disabled}
            required>
            <option value="">選択</option>
            <option value="月">月曜</option>
            <option value="火">火曜</option>
            <option value="水">水曜</option>
            <option value="木">木曜</option>
            <option value="金">金曜</option>
            <option value="土">土曜</option>
            <option value="日">日曜</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-none border border-gray-400 bg-blue-100 px-2 py-1 text-xs text-gray-800 hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-gray-200"
          disabled={disabled || !date || !toDay}>
          追加
        </button>
      </div>
      <div>
        <label className="block text-xs text-gray-700">説明 (任意):</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: 祝日振替授業"
          className="w-full rounded-none border border-gray-400 bg-white px-1 py-0.5 text-xs focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200"
          disabled={disabled}
        />
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </form>
  )
}

export default function CourseList() {
  // 入力・状態管理
  const [repeatStart, setRepeatStart] = useState("")
  const [repeatEnd, setRepeatEnd] = useState("")
  const [calendarList, setCalendarList] = useState<CalendarItem[]>([])
  const [calendarId, setCalendarId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // 時間割変更関連の状態管理
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [showScheduleSettings, setShowScheduleSettings] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  // コース情報の取得
  const courseInfoList = useMemo<CourseInfo[]>(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const periods = [1, 2, 3, 4, 5, 6, 7, 8]
    return days
      .map((day) =>
        periods.map((period) => {
          const courseNumberLinkEle = document.querySelector(
            `#ctl00_phContents_rrMain_ttTable_lct${day}${period}_ctl00_lblLctCd>a`
          )
          const courseNameLinkEle = document.querySelector(
            `#ctl00_phContents_rrMain_ttTable_lct${day}${period}_ctl00_lblStaffName>a`
          )
          if (courseNumberLinkEle && courseNameLinkEle) {
            const text = (courseNameLinkEle as HTMLElement).innerText
              .trim()
              .replace("★", "")
            const [courseName = "", teacherLine = ""] = text.split("\n")
            let teacherName = ""
            if (teacherLine) {
              const match = teacherLine.match(/[(（](.*)[)）]/)
              teacherName = match
                ? match[1].replace("　", "")
                : teacherLine.replace("　", "")
            }
            return {
              day,
              period,
              syllabusLink:
                window.location.origin +
                courseNumberLinkEle.getAttribute("href"),
              courseName,
              teacherName
            } as CourseInfo
          }
        })
      )
      .flat()
      .filter(Boolean) as CourseInfo[]
  }, [])

  // 曜日→BYDAY変換
  const getByDay = useCallback((day: string) => {
    const dayMap = {
      Mon: "MO",
      Tue: "TU",
      Wed: "WE",
      Thu: "TH",
      Fri: "FR",
      Sat: "SA"
    }
    return dayMap[day] || ""
  }, [])

  // 曜日から最初の日付を取得
  const getFirstDateOfWeekday = useCallback(
    (startDateStr: string, weekdayStr: string) => {
      const dayMapNum = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      const startDate = new Date(startDateStr)
      const startDay = startDate.getDay() === 0 ? 7 : startDate.getDay()
      const targetDay = dayMapNum[weekdayStr]
      const diff = (targetDay - startDay + 7) % 7
      const firstDate = new Date(startDate)
      firstDate.setDate(startDate.getDate() + diff)
      return firstDate.toISOString().slice(0, 10)
    },
    []
  )

  // イベント詳細生成
  const formatEventDetails = useCallback((course: CourseInfo): string => {
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
  }, [])

  // シラバス取得
  const fetchAndParseSyllabus = useCallback(
    async (course: CourseInfo): Promise<CourseInfo> => {
      try {
        const res = await fetch(course.syllabusLink)
        const html = await res.text()
        const syllabus = parseSyllabus(html)
        return { ...course, syllabus }
      } catch {
        return { ...course, syllabus: null }
      }
    },
    []
  )

  // カレンダーリスト取得
  const fetchAndSetWritableCalendars = useCallback(() => {
    chrome.runtime.sendMessage({ type: "GET_CALENDAR_LIST" }, (res) => {
      if (res && res.success && res.items) {
        const writable = res.items.filter(
          (cal: CalendarItem) =>
            cal.accessRole === "writer" || cal.accessRole === "owner"
        )
        setCalendarList(writable)
        if (writable.length > 0) setCalendarId(writable[0].id)
      }
    })
  }, [])

  // 祝日取得
  const fetchHolidays = useCallback((startDate: string, endDate: string) => {
    const timeMin = `${startDate}T00:00:00+09:00`
    const timeMax = `${endDate}T23:59:59+09:00`

    chrome.runtime.sendMessage(
      { type: "GET_HOLIDAYS", timeMin, timeMax },
      (res) => {
        if (res && res.success && res.holidays) {
          setHolidays(res.holidays)
        }
      }
    )
  }, [])

  // 時間割変更管理関数
  const addScheduleChange = useCallback(
    (date: string, fromDay: string, toDay: string, description?: string) => {
      const newChange: ScheduleChange = {
        id: Date.now().toString(),
        date,
        fromDay,
        toDay,
        description
      }
      setScheduleChanges((prev) => [...prev, newChange])
    },
    []
  )

  const removeScheduleChange = useCallback((id: string) => {
    setScheduleChanges((prev) => prev.filter((change) => change.id !== id))
  }, [])

  // 指定された日付が祝日かチェック
  const isHoliday = useCallback(
    (date: string): boolean => {
      return holidays.some((holiday) => holiday.date === date)
    },
    [holidays]
  )

  // 指定された日付の時間割変更をチェック
  const getScheduleChangeForDate = useCallback(
    (date: string): ScheduleChange | null => {
      return scheduleChanges.find((change) => change.date === date) || null
    },
    [scheduleChanges]
  )

  // 日本語曜日から英語曜日への変換
  const convertJapaneseDayToEnglish = useCallback((jpDay: string): string => {
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
  }, [])

  // カレンダーイベント作成（RRULE版：祝日除外・時間割変更対応）
  const createCalendarEvent = useCallback(
    async (course: CourseInfo) => {
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
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const currentDay = d.getDay()
        const dateStr = d.toISOString().slice(0, 10)

        // 該当曜日でない場合はスキップ
        if (currentDay !== targetDayNum) {
          continue
        }

        // 祝日チェック
        if (isHoliday(dateStr)) {
          datesToDelete.push(dateStr)
          continue
        }

        // 時間割変更チェック
        const scheduleChange = getScheduleChangeForDate(dateStr)
        if (scheduleChange) {
          datesToDelete.push(dateStr)
        }
      }

      // 時間割変更日の個別イベントを探す（変更先が元の曜日と一致する場合）
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().slice(0, 10)
        const scheduleChange = getScheduleChangeForDate(dateStr)

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
    },
    [
      calendarId,
      formatEventDetails,
      isHoliday,
      getScheduleChangeForDate,
      repeatEnd,
      repeatStart
    ]
  )

  // 遅延関数
  // 指定ミリ秒後に解決するPromiseを返す
  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // イベント一括追加
  const fetchAndCreateEvents = useCallback(async () => {
    setError(null)
    setProgress(0)
    setIsLoading(true)
    try {
      if (!repeatStart || !repeatEnd || !calendarId) {
        setError("カレンダー、開始日、終了日をすべて入力してください。")
        setIsLoading(false)
        return
      }

      // まず祝日情報を取得
      await new Promise<void>((resolve) => {
        fetchHolidays(repeatStart, repeatEnd)
        // 祝日取得の完了を少し待つ
        setTimeout(resolve, 1000)
      })

      const courseListWithSyllabus: CourseInfo[] = []
      for (let i = 0; i < courseInfoList.length; i++) {
        await delay(300 + Math.random() * 200)
        courseListWithSyllabus.push(
          await fetchAndParseSyllabus(courseInfoList[i])
        )
        setProgress(Math.round(((i + 1) / courseInfoList.length) * 100))
      }
      await Promise.all(
        courseListWithSyllabus.map((course) => createCalendarEvent(course))
      )
      setIsOpen(false)
      setProgress(0)
      setIsAlertOpen(true)
    } finally {
      setIsLoading(false)
    }
  }, [
    calendarId,
    courseInfoList,
    createCalendarEvent,
    fetchAndParseSyllabus,
    fetchHolidays,
    repeatEnd,
    repeatStart
  ])

  return (
    <div className="w-full">
      {/* 追加完了アラートダイアログ */}
      <AlertDialogRoot open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/20" />
        <AlertDialogContent className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-none border border-gray-400 bg-gray-100 p-4 font-sans shadow-none">
          <AlertDialogTitle className="m-0 border-b border-gray-400 pb-1 font-bold text-gray-800">
            追加が完了しました
          </AlertDialogTitle>
          <AlertDialogDescription className="mb-4 mt-2 text-gray-700">
            全ての授業がGoogleカレンダーに追加されました。
          </AlertDialogDescription>
          <div className="flex justify-end">
            <AlertDialogAction asChild>
              <button className="rounded-none border border-gray-400 bg-gray-200 px-3 py-1 text-gray-800 shadow-none hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
                閉じる
              </button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogRoot>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            onClick={fetchAndSetWritableCalendars}
            className="ml-auto mr-1 block rounded border border-slate-500 bg-slate-100 p-1 transition hover:bg-slate-200">
            カレンダーに追加
          </button>
        </Dialog.Trigger>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 flex w-96 max-w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-none border border-gray-400 bg-gray-100 p-4 font-sans shadow-none">
          <Dialog.Title className="mb-1 border-b border-gray-400 pb-1 font-bold text-gray-800">
            カレンダーに追加
          </Dialog.Title>
          <Dialog.Description className="mb-2 text-gray-700">
            登録されている全ての授業をGoogleカレンダーに追加します。
            <br />
            この操作は元に戻せません。
          </Dialog.Description>
          <div className="mb-1 flex flex-col gap-1">
            <label className="text-gray-800">
              カレンダー:
              <select
                className="ml-2 rounded-none border border-gray-400 bg-white px-1 py-0.5 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                disabled={isLoading}>
                <option value="">選択してください</option>
                {[...calendarList].reverse().map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-gray-800">
              繰り返し開始日:
              <input
                type="date"
                className="ml-2 rounded-none border border-gray-400 bg-white px-1 py-0.5 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                value={repeatStart}
                onChange={(e) => {
                  setRepeatStart(e.target.value)
                  if (repeatEnd && e.target.value > repeatEnd) {
                    setError("開始日は終了日以前にしてください。")
                  } else {
                    setError(null)
                  }
                }}
                disabled={isLoading}
              />
            </label>
            <label className="text-gray-800">
              繰り返し終了日:
              <input
                type="date"
                className="ml-2 rounded-none border border-gray-400 bg-white px-1 py-0.5 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                value={repeatEnd}
                onChange={(e) => {
                  setRepeatEnd(e.target.value)
                  if (repeatStart && repeatStart > e.target.value) {
                    setError("終了日は開始日以降にしてください。")
                  } else {
                    setError(null)
                  }
                }}
                disabled={isLoading}
              />
            </label>

            {/* 時間割変更設定セクション */}
            <div className="mt-3 border-t border-gray-300 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="font-medium text-gray-800">
                  時間割変更設定:
                </label>
                <button
                  type="button"
                  onClick={() => setShowScheduleSettings(!showScheduleSettings)}
                  className="text-sm text-blue-600 underline hover:text-blue-800"
                  disabled={isLoading}>
                  {showScheduleSettings ? "非表示" : "設定"}
                </button>
              </div>

              {showScheduleSettings && (
                <div className="space-y-2 rounded border bg-gray-50 p-2">
                  <div className="mb-2 text-xs text-gray-600">
                    特別授業日や祝日振替等の時間割変更を設定できます
                  </div>

                  {/* 新しい変更を追加するフォーム */}
                  <ScheduleChangeForm
                    onAdd={addScheduleChange}
                    disabled={isLoading}
                    existingChanges={scheduleChanges}
                    semesterStart={repeatStart}
                    semesterEnd={repeatEnd}
                  />

                  {/* 設定済みの変更一覧 */}
                  {scheduleChanges.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 text-sm font-medium text-gray-700">
                        設定済みの変更:
                      </div>
                      <div className="space-y-1">
                        {scheduleChanges.map((change) => (
                          <div
                            key={change.id}
                            className="flex items-center justify-between rounded border bg-white p-2 text-xs">
                            <span>
                              {change.date} (
                              {new Date(change.date).toLocaleDateString(
                                "ja-JP",
                                { weekday: "short" }
                              )}
                              ) → {change.toDay}曜日の時間割
                              {change.description && (
                                <span className="text-gray-500">
                                  {" "}
                                  ({change.description})
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => removeScheduleChange(change.id)}
                              className="ml-2 text-red-600 hover:text-red-800"
                              disabled={isLoading}>
                              削除
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && <div className="mt-1 text-red-600">{error}</div>}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                className="rounded-none border border-gray-400 bg-gray-200 px-3 py-1 text-gray-800 shadow-none hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                disabled={isLoading}>
                キャンセル
              </button>
            </Dialog.Close>
            <button
              className="rounded-none border border-gray-400 bg-gray-300 px-3 py-1 text-gray-900 shadow-none hover:bg-gray-400 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              onClick={fetchAndCreateEvents}
              disabled={isLoading}>
              追加する
            </button>
          </div>
          <Progress.Root
            className="relative mt-2 h-2 w-full overflow-hidden rounded-none border border-gray-400 bg-gray-200"
            style={{ transform: "translateZ(0)" }}
            value={progress}>
            <Progress.Indicator
              className="h-full bg-blue-400 transition-transform duration-500"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </Progress.Root>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}
