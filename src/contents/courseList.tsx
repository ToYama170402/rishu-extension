import { isErrored } from "stream"
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
import { useCallback, useMemo, useState } from "react"

import { parseSyllabus } from "./util/parseSyllabus"
import periodToTime from "./util/periodToTime"

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

  // カレンダーイベント作成
  const createCalendarEvent = useCallback(
    async (course: CourseInfo) => {
      const { startTime, endTime } = periodToTime(course.period)
      const byDay = getByDay(course.day)
      const until = repeatEnd.replace(/-/g, "") + "T235959Z"
      const firstDate = getFirstDateOfWeekday(repeatStart, course.day)
      const startTimeStr = startTime.toTimeString().slice(0, 8)
      const endTimeStr = endTime.toTimeString().slice(0, 8)
      const startDateTime = `${firstDate}T${startTimeStr}+09:00`
      const endDateTime = `${firstDate}T${endTimeStr}+09:00`
      const location = course.syllabus?.room || ""
      const event = {
        summary: `${course.courseName}`,
        description: formatEventDetails(course),
        startDateTime,
        endDateTime,
        timeZone: "Asia/Tokyo",
        recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`],
        calendarId,
        location
      }
      await new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "CREATE_CALENDAR_EVENT", event },
          (res) => resolve()
        )
      })
    },
    [
      calendarId,
      formatEventDetails,
      getByDay,
      getFirstDateOfWeekday,
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
    repeatEnd,
    repeatStart
  ])

  return (
    <div className="w-full">
      {/* 追加完了アラートダイアログ */}
      <AlertDialogRoot open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogOverlay className="fixed inset-0 bg-black/30" />
        <AlertDialogContent className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg focus:outline-none">
          <AlertDialogTitle className="m-0 text-lg font-medium text-slate-900">
            追加が完了しました
          </AlertDialogTitle>
          <AlertDialogDescription className="mb-5 mt-4 text-base leading-normal text-slate-700">
            全ての授業がGoogleカレンダーに追加されました。
          </AlertDialogDescription>
          <div className="flex justify-end">
            <AlertDialogAction asChild>
              <button className="inline-flex h-[35px] select-none items-center justify-center rounded bg-blue-100 px-4 font-medium text-blue-700 outline-none outline-offset-1 hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-blue-400">
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
        <Dialog.Content className="fixed left-1/2 top-1/2 flex w-80 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded bg-white p-6 shadow-lg">
          <Dialog.Title className="mb-2 text-lg font-bold">
            カレンダーに追加
          </Dialog.Title>
          <Dialog.Description className="mb-4 text-sm text-slate-600">
            登録されている全ての授業をGoogleカレンダーに追加します。
            <br />
            この操作は元に戻せません。
          </Dialog.Description>
          <div className="mb-2 flex flex-col gap-2">
            <label className="text-xs text-slate-700">
              カレンダー:
              <select
                className="ml-2 rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
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
            <label className="text-xs text-slate-700">
              繰り返し開始日:
              <input
                type="date"
                className="ml-2 rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
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
            <label className="text-xs text-slate-700">
              繰り返し終了日:
              <input
                type="date"
                className="ml-2 rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
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
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                className="rounded border border-slate-300 bg-slate-50 px-3 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-70"
                disabled={isLoading}>
                キャンセル
              </button>
            </Dialog.Close>
            <button
              className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200 disabled:opacity-70"
              onClick={fetchAndCreateEvents}
              disabled={
                isLoading ||
                !calendarId ||
                !repeatStart ||
                !repeatEnd ||
                error !== null
              }>
              追加する
            </button>
          </div>
          <Progress.Root
            className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200"
            style={{ transform: "translateZ(0)" }}
            value={progress}>
            <Progress.Indicator
              className="h-full bg-blue-600 transition-transform duration-500"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </Progress.Root>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}
