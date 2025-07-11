import type { PlasmoCSConfig } from "plasmo"

import type { registeredCourseElement } from "./type/registeredCourse"
import arrayToRegistStatus from "./util/arrayToregistStatus"
import { calcApplicantsRatio } from "./util/calcRegistrationRatio"

export const config: PlasmoCSConfig = {
  matches: [
    "https://eduweb.sta.kanazawa-u.ac.jp/Portal/StudentApp/Regist/RegistEdit.aspx"
  ]
}
window.addEventListener("load", async () => {
  // 履修登録状況のリンクを取得
  const registrationStatusAnchor = document.getElementById(
    "ctl00_phContents_ucRegistEdit_lnkrationStatus"
  ) as HTMLAnchorElement

  const courseRegistStatusPageIframe = document.createElement("iframe")
  courseRegistStatusPageIframe.src = registrationStatusAnchor.href
  courseRegistStatusPageIframe.id = "registration-status-iframe"
  courseRegistStatusPageIframe.style.display = "none"

  document.body.appendChild(courseRegistStatusPageIframe)

  let isFirstLoad = true

  const waitForIframeLoad = (iframe: HTMLIFrameElement) =>
    new Promise<void>((resolve) => {
      iframe.onload = () => resolve()
    })

  await waitForIframeLoad(courseRegistStatusPageIframe)

  if (isFirstLoad) {
    isFirstLoad = false

    const event = new Event("change", {
      bubbles: true,
      cancelable: true
    })

    // 履修登録状況ページの表示件数を選択する要素を取得
    const courseRegistItemPerPageDropdown =
      courseRegistStatusPageIframe.contentWindow.document.getElementById(
        "ctl00_phContents_ucRegistrationStatus_ddlLns_ddl"
      ) as HTMLSelectElement

    // 1ページあたりの表示件数を全件に設定
    courseRegistItemPerPageDropdown.value = "0"
    // ページ側のイベントハンドラーを動作させるために必要
    courseRegistItemPerPageDropdown.dispatchEvent(event)

    await waitForIframeLoad(courseRegistStatusPageIframe)
  }
  // 履修登録状況のtable要素を取得
  const registrationStatusTable =
    courseRegistStatusPageIframe.contentWindow.document.getElementById(
      "ctl00_phContents_ucRegistrationStatus_gv"
    )
  const registrationStatus = arrayToRegistStatus(
    Array.from(registrationStatusTable.querySelectorAll("tr"))
      .map((e) =>
        Array.from(e.querySelectorAll("td")).map((f) =>
          f.innerText.replace(/(\s{2,}|　)/g, "")
        )
      )
      .slice(1) // ヘッダー行を除外
  )

  const timetableCellsHasCourse = Array.from(
    document.querySelectorAll(".regist_blank_column") // 履修登録の各時間割セルを取得
  ).filter((e) => e.getElementsByTagName("div").length > 1) // 講義が登録されているセルのみを対象

  const registeredCourseElements: registeredCourseElement[] =
    timetableCellsHasCourse
      .map((timetableCell) =>
        Array.from(timetableCell.getElementsByTagName("div"))
          .filter((div) => div.parentElement === timetableCell)
          .slice(0, -1)
          .map((div, i) => {
            return {
              element: div,
              priority: (i + 1) as 1 | 2 | 3 | 4 | 5,
              status: registrationStatus.find(
                (status) =>
                  status.course.courseNumber ===
                  div.getElementsByTagName("a")[0].innerText
              )
            }
          })
      )
      .flat()

  registeredCourseElements.forEach((registeredCourseElement) => {
    const { element, priority, status } = registeredCourseElement
    const isPrimary = element.getElementsByTagName("a")[1].innerText.match("★")
    const registStatus = document.createElement("div")
    if ("allRegistNumber" in status) {
      const applicantsRatio = calcApplicantsRatio(status)
      const ratio =
        isPrimary && priority === 1
          ? applicantsRatio[0]
          : applicantsRatio[priority] // priorityは1スタート
      registStatus.innerText = Math.round(ratio * 100) + "%"
      element.querySelector("div").appendChild(registStatus)
    }
  })

  return
})
