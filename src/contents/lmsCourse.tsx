import * as Dialog from "@radix-ui/react-dialog"
import * as Progress from "@radix-ui/react-progress"
import cssText from "data-text:@/style.css"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useCallback, useEffect, useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://lms-wc.el.kanazawa-u.ac.jp/webclass/course.php*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  // Look for the main content area where we'll insert our controls
  const contentArea = document.querySelector(".col-xs-12")
  return contentArea 
    ? { element: contentArea, insertPosition: "afterbegin" }
    : null
}

interface Assignment {
  title: string
  type: string
  expire: {
    start: Date
    end: Date
  } | null
  element: Element
  isSubmitted: boolean
}

interface TaskList {
  id: string
  title: string
}

export default function LMSCourseAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [selectedTaskList, setSelectedTaskList] = useState<string>("@default")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Extract assignments from the page using the provided logic
  const extractAssignments = useCallback((): Assignment[] => {
    const assignmentElements = Array.from(
      document.querySelectorAll(".col-xs-12 .list-group-item")
    )

    return assignmentElements.map((e) => {
      const titleElement = e.querySelector(".cm-contentsList_contentName *:last-child")
      const typeElement = e.querySelector(".cl-contentsList_categoryLabel")
      const expireElement = e.querySelector(".cm-contentsList_contentDetailListItemData")
      
      let expireData = null
      if (expireElement) {
        try {
          const [startStr, endStr] = expireElement.textContent.split("-").map(str => str.trim())
          const [startYear, startMonth, startDay, startHour, startMinute] = startStr.split(/[\/ :]/)
          const [endYear, endMonth, endDay, endHour, endMinute] = endStr.split(/[\/ :]/)
          
          const startDateTime = new Date(
            parseInt(startYear),
            parseInt(startMonth) - 1,
            parseInt(startDay),
            parseInt(startHour),
            parseInt(startMinute)
          )
          const endDateTime = new Date(
            parseInt(endYear),
            parseInt(endMonth) - 1,
            parseInt(endDay),
            parseInt(endHour),
            parseInt(endMinute)
          )
          
          expireData = { start: startDateTime, end: endDateTime }
        } catch (err) {
          console.warn("Failed to parse date:", expireElement.textContent, err)
        }
      }

      // Check if assignment is submitted (this is a simple heuristic, might need adjustment)
      const isSubmitted = e.querySelector(".label-success") !== null ||
                         e.textContent.includes("提出済み") ||
                         e.textContent.includes("完了")

      return {
        title: titleElement?.textContent?.trim() || "無題の課題",
        type: typeElement?.textContent?.trim() || "",
        expire: expireData,
        element: e,
        isSubmitted
      }
    }).filter(assignment => 
      assignment.title && 
      assignment.type &&
      (assignment.type.includes("レポート") || assignment.type.includes("課題"))
    )
  }, [])

  // Load assignments and task lists
  useEffect(() => {
    const loadedAssignments = extractAssignments()
    setAssignments(loadedAssignments)

    // Load Google Tasks lists
    chrome.runtime.sendMessage({ type: "GET_TASKS_LIST" }, (response) => {
      if (response?.success && response.items) {
        setTaskLists(response.items)
        if (response.items.length > 0) {
          setSelectedTaskList(response.items[0].id)
        }
      }
    })
  }, [extractAssignments])

  const createTask = useCallback(async (assignment: Assignment) => {
    const dueDate = assignment.expire?.end
    const taskData = {
      title: assignment.title,
      notes: `コース: ${document.title}\n種別: ${assignment.type}${
        assignment.expire 
          ? `\n提出期限: ${assignment.expire.end.toLocaleString("ja-JP")}`
          : ""
      }`,
      due: dueDate ? dueDate.toISOString() : null,
      tasklistId: selectedTaskList
    }

    return new Promise<void>((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "CREATE_TASK", task: taskData },
        (response) => {
          if (response?.success) {
            resolve()
          } else {
            reject(new Error(response?.error || "タスクの作成に失敗しました"))
          }
        }
      )
    })
  }, [selectedTaskList])

  const addSingleTask = useCallback(async (assignment: Assignment) => {
    setIsLoading(true)
    try {
      await createTask(assignment)
      // Visual feedback - add a checkmark to the assignment
      const button = assignment.element.querySelector(".task-add-btn")
      if (button) {
        button.textContent = "✓ 追加済み"
        button.setAttribute("disabled", "true")
      }
    } catch (err) {
      console.error("Failed to create task:", err)
      alert(`タスクの追加に失敗しました: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [createTask])

  const addAllTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      const unsubmittedReports = assignments.filter(
        a => !a.isSubmitted && 
        a.expire && 
        a.expire.end > new Date() // Not expired
      )

      if (unsubmittedReports.length === 0) {
        setError("追加可能な未提出のレポート課題がありません。")
        return
      }

      for (let i = 0; i < unsubmittedReports.length; i++) {
        await createTask(unsubmittedReports[i])
        setProgress(Math.round(((i + 1) / unsubmittedReports.length) * 100))
      }

      setIsDialogOpen(false)
      alert(`${unsubmittedReports.length}件のレポート課題をGoogleタスクに追加しました。`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }, [assignments, createTask])

  // Add individual task buttons to each assignment
  useEffect(() => {
    assignments.forEach((assignment) => {
      if (assignment.element.querySelector(".task-add-btn")) return // Already has button

      const button = document.createElement("button")
      button.className = "task-add-btn btn btn-sm btn-info"
      button.style.marginLeft = "10px"
      button.textContent = "タスクに追加"
      button.onclick = () => addSingleTask(assignment)

      const titleContainer = assignment.element.querySelector(".cm-contentsList_contentName")
      if (titleContainer) {
        titleContainer.appendChild(button)
      }
    })
  }, [assignments, addSingleTask])

  const reportAssignments = assignments.filter(a => 
    a.type.includes("レポート") || a.type.includes("課題")
  )
  const unsubmittedReports = reportAssignments.filter(a => 
    !a.isSubmitted && a.expire && a.expire.end > new Date()
  )

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-blue-800">
            📝 Googleタスク連携
          </h3>
          <p className="text-sm text-blue-600">
            レポート課題: {reportAssignments.length}件 
            (未提出: {unsubmittedReports.length}件)
          </p>
        </div>
        
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger asChild>
            <button 
              className="btn btn-primary"
              disabled={unsubmittedReports.length === 0 || isLoading}
            >
              📋 未提出課題を一括追加
            </button>
          </Dialog.Trigger>
          
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/20" />
            <Dialog.Content className="fixed left-1/2 top-1/2 flex w-96 max-w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded border border-gray-400 bg-white p-4 font-sans shadow-lg">
              <Dialog.Title className="mb-1 border-b border-gray-400 pb-1 font-bold text-gray-800">
                Googleタスクに一括追加
              </Dialog.Title>
              
              <Dialog.Description className="mb-2 text-gray-700">
                未提出のレポート課題 {unsubmittedReports.length}件をGoogleタスクに追加します。
              </Dialog.Description>

              <div className="mb-1 flex flex-col gap-1">
                <label className="text-gray-800">
                  タスクリスト:
                  <select
                    className="ml-2 rounded border border-gray-400 bg-white px-2 py-1"
                    value={selectedTaskList}
                    onChange={(e) => setSelectedTaskList(e.target.value)}
                    disabled={isLoading}
                  >
                    {taskLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </label>
                {error && <div className="mt-1 text-red-600">{error}</div>}
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    className="rounded border border-gray-400 bg-gray-200 px-3 py-1 text-gray-800 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    disabled={isLoading}
                  >
                    キャンセル
                  </button>
                </Dialog.Close>
                <button
                  className="rounded border border-blue-500 bg-blue-500 px-3 py-1 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  onClick={addAllTasks}
                  disabled={isLoading || unsubmittedReports.length === 0}
                >
                  追加する
                </button>
              </div>

              {isLoading && (
                <Progress.Root className="relative mt-2 h-2 w-full overflow-hidden rounded bg-gray-200">
                  <Progress.Indicator
                    className="h-full bg-blue-500 transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </Progress.Root>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}