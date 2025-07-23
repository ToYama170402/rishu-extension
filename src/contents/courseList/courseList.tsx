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
import React, { useMemo, useState } from "react"

import { fetchAndCreateEvents } from "./util/eventCreationUtils"
import { fetchAndSetWritableCalendars } from "./util/googleApiUtils"
import {
  addScheduleChange as addScheduleChangeUtil,
  removeScheduleChange as removeScheduleChangeUtil
} from "./util/scheduleChangeUtils"
import type {
  CalendarItem,
  CourseInfo,
  Holiday,
  ScheduleChange,
  SyllabusInfo
} from "./util/types"

// 型定義を再エクスポート
export type {
  SyllabusInfo,
  CalendarItem,
  CourseInfo,
  ScheduleChange,
  Holiday
} from "./util/types"

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

  // 時間割変更管理関数
  const addScheduleChange = (
    date: string,
    fromDay: string,
    toDay: string,
    description?: string
  ) => {
    setScheduleChanges((prev) =>
      addScheduleChangeUtil(prev, date, fromDay, toDay, description)
    )
  }

  const removeScheduleChange = (id: string) => {
    setScheduleChanges((prev) => removeScheduleChangeUtil(prev, id))
  }

  // カレンダーリスト取得とセット
  const handleFetchAndSetWritableCalendars = async () => {
    const calendars = await fetchAndSetWritableCalendars()
    setCalendarList(calendars)
    if (calendars.length > 0) setCalendarId(calendars[0].id)
  }

  // イベント一括追加の処理
  const handleFetchAndCreateEvents = async () => {
    setError(null)
    setProgress(0)
    setIsLoading(true)
    try {
      await fetchAndCreateEvents(
        courseInfoList,
        repeatStart,
        repeatEnd,
        calendarId,
        scheduleChanges,
        setProgress
      )
      setIsOpen(false)
      setProgress(0)
      setIsAlertOpen(true)
    } catch (err) {
      setError(err.message || "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

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
            onClick={handleFetchAndSetWritableCalendars}
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
              onClick={handleFetchAndCreateEvents}
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
