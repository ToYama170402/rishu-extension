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
  const registrationStatusAnchor = document.getElementById(
    "ctl00_phContents_ucRegistEdit_lnkrationStatus"
  ) as HTMLAnchorElement

  const iframe = document.createElement("iframe")
  iframe.src = registrationStatusAnchor.href
  iframe.id = "registration-status-iframe"
  iframe.style.display = "none"

  document.body.appendChild(iframe)

  let isFirstLoad = true

  const waitForIframeLoad = (iframe: HTMLIFrameElement) =>
    new Promise<void>((resolve) => {
      iframe.onload = () => resolve()
    })

  await waitForIframeLoad(iframe)

  if (isFirstLoad) {
    isFirstLoad = false

    const event = new Event("change", {
      bubbles: true,
      cancelable: true
    })

    const select = iframe.contentWindow.document.getElementById(
      "ctl00_phContents_ucRegistrationStatus_ddlLns_ddl"
    ) as HTMLSelectElement
    select.value = "0"
    select.dispatchEvent(event)

    await waitForIframeLoad(iframe)
  }
  const table = iframe.contentWindow.document.getElementById(
    "ctl00_phContents_ucRegistrationStatus_gv"
  )
  const registrationStatus = arrayToRegistStatus(
    Array.from(table.querySelectorAll("tr"))
      .map((e) =>
        Array.from(e.querySelectorAll("td")).map((f) =>
          f.innerText.replace(/(\s{2,}|　)/g, "")
        )
      )
      .slice(1)
  )

  const timetableCells = Array.from(
    document.querySelectorAll(".regist_blank_column")
  ).filter((e) => e.getElementsByTagName("div").length > 1)

  const registeredCourseElements: registeredCourseElement[] = timetableCells
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
          : applicantsRatio[priority]
      registStatus.innerText = Math.round(ratio * 100) + "%"
      element.querySelector("div").appendChild(registStatus)
    }
  })

  return
})
