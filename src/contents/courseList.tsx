import * as Dialog from "@radix-ui/react-dialog"
import cssText from "data-text:@/style.css"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useEffect, useMemo, useState } from "react"

import periodToTime from "./util/periodToTime"

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

export default () => {
  const courseInfoList = useMemo(
    () =>
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        .map((day) =>
          [1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
            const courseNumberLinkEle = document.querySelector(
              `#ctl00_phContents_rrMain_ttTable_lct${day}${period}_ctl00_lblLctCd>a`
            )
            const courseNameLinkEle = document.querySelector(
              `#ctl00_phContents_rrMain_ttTable_lct${day}${period}_ctl00_lblStaffName>a`
            )
            if (courseNumberLinkEle && courseNameLinkEle)
              return {
                day: day,
                period: period,
                syllabusLink:
                  window.location.origin +
                  courseNumberLinkEle.getAttribute("href"),
                // より堅牢なパース: 1行目を科目名、2行目の括弧内を教員名とする
                ...(() => {
                  const text = (
                    courseNameLinkEle as HTMLElement
                  ).innerText.trim()
                  const lines = text.split("\n")
                  const courseName = lines[0] || ""
                  let teacherName = ""
                  if (lines.length > 1) {
                    const match = lines[1].match(/[(（](.*)[)）]/)
                    teacherName = match
                      ? match[1].replace("　", "")
                      : lines[1].replace("　", "")
                  }
                  return { courseName, teacherName }
                })()
              }
          })
        )
        .flat()
        .filter((e) => e),
    []
  )

  const [repeatStart, setRepeatStart] = useState("")
  const [repeatEnd, setRepeatEnd] = useState("")
  const [calendarList, setCalendarList] = useState<
    Array<{ id: string; summary: string }>
  >([])
  const [calendarId, setCalendarId] = useState("")

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_CALENDAR_LIST" }, (res) => {
      if (res && res.success && res.items) {
        // 書き込み権限のあるカレンダーだけにフィルター
        const writable = res.items.filter(
          (cal: any) =>
            cal.accessRole === "writer" || cal.accessRole === "owner"
        )
        setCalendarList(writable)
        if (writable.length > 0) setCalendarId(writable[0].id)
      }
    })
  }, [])

  // repeatStartから各曜日の最初の日付を計算する関数
  function getFirstDateOfWeekday(startDateStr: string, weekdayStr: string) {
    const dayMapNum = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    const startDate = new Date(startDateStr)
    const startDay = startDate.getDay() === 0 ? 7 : startDate.getDay() // 日曜は7
    const targetDay = dayMapNum[weekdayStr]
    const diff = (targetDay - startDay + 7) % 7
    const firstDate = new Date(startDate)
    firstDate.setDate(startDate.getDate() + diff)
    return firstDate.toISOString().slice(0, 10)
  }

  function getByDay(day: string) {
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

  async function createCalendarEvent(course: any) {
    const { startTime, endTime } = periodToTime(course.period)
    const byDay = getByDay(course.day)
    const until = repeatEnd.replace(/-/g, "") + "T235959Z"
    const firstDate = getFirstDateOfWeekday(repeatStart, course.day)
    const startTimeStr = startTime.toTimeString().slice(0, 8)
    const endTimeStr = endTime.toTimeString().slice(0, 8)
    const startDateTime = `${firstDate}T${startTimeStr}+09:00`
    const endDateTime = `${firstDate}T${endTimeStr}+09:00`
    const event = {
      summary: `${course.courseName}`,
      description: `担当教員: ${course.teacherName}\nシラバス: ${course.syllabusLink}`,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      timeZone: "Asia/Tokyo",
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`],
      calendarId
    }
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        { type: "CREATE_CALENDAR_EVENT", event },
        (res) => {
          if (res && res.success) {
            console.log(
              `カレンダーに正常に追加されました: ${course.courseName}`
            )
          } else {
            console.error(
              `イベントの追加に失敗しました: ${course.courseName}`,
              res?.error
            )
          }
          resolve()
        }
      )
    })
  }

  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    if (!repeatStart || !repeatEnd || !calendarId) {
      setError("カレンダー、開始日、終了日をすべて入力してください。")
      return
    }
    ;(async () => {
      for (const course of courseInfoList) {
        await createCalendarEvent(course)
      }
    })()
  }
  return (
    <div className="w-full">
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button className="ml-auto mr-1 block rounded border border-slate-500 bg-slate-100 p-1 transition hover:bg-slate-200">
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
                className="ml-2 rounded border px-2 py-1 text-xs"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}>
                <option value="">選択してください</option>
                {calendarList.reverse().map((cal: any) => (
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
                className="ml-2 rounded border px-2 py-1 text-xs"
                value={repeatStart}
                onChange={(e) => setRepeatStart(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-700">
              繰り返し終了日:
              <input
                type="date"
                className="ml-2 rounded border px-2 py-1 text-xs"
                value={repeatEnd}
                onChange={(e) => setRepeatEnd(e.target.value)}
              />
            </label>
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
          <ul className="mb-4 max-h-32 list-disc overflow-y-auto pl-5 text-xs text-slate-700">
            {courseInfoList.map((course: any, i) => (
              <li key={i}>
                {course.courseName}（{course.teacherName}）
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded border border-slate-300 bg-slate-50 px-3 py-1 transition hover:bg-slate-100">
                キャンセル
              </button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <button
                className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700"
                onClick={handleClick}>
                追加する
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}
