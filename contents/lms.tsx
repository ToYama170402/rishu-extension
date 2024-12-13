import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

import type { course } from "./type"

export const config: PlasmoCSConfig = {
  matches: ["https://acanthus.cis.kanazawa-u.ac.jp/base/lms-course/list"]
}

const target = document.getElementsByClassName(
  "module-toggle-panel__body-inner"
)[1]! as HTMLElement

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => target
export default () => {
  target.style.display = "none"
  const courseList = target
    .getElementsByTagName("tbody")[0]
    .getElementsByTagName("tr")
  const courseInfoList = Array.from(courseList).map((course) => {
    const courseInfo: course = {
      yearQuoter: {
        year: parseInt(
          (
            course.getElementsByClassName(
              "lms-course-list-teaching_list-year"
            )[0] as HTMLElement
          ).innerText
        ),
        quoter: parseInt(
          (
            course.getElementsByClassName(
              "lms-course-list-teaching_list-term"
            )[0] as HTMLElement
          ).innerText.replace(/Q(\d)/, "$1")
        )! as 1 | 2 | 3 | 4
      },
      datePeriod: {
        date: (
          course.getElementsByClassName(
            "lms-course-list-teaching_list-week_time"
          )[0] as HTMLElement
        ).innerText.replace(/(月|火|水|木|金|土|日)\/.*/, "$1")! as
          | "月"
          | "火"
          | "水"
          | "木"
          | "金"
          | "土"
          | "日",
        period: parseInt(
          (
            course.getElementsByClassName(
              "lms-course-list-teaching_list-week_time"
            )[0] as HTMLElement
          ).innerText.replace(/.*\/(1|2|3|4|5|6|7)時限/, "$1")
        )
      },
      courseNumber: (
        course.getElementsByClassName(
          "lms-course-list-teaching_list-course_no"
        )[0] as HTMLElement
      ).innerText,
      courseName: course
        .getElementsByClassName("lms-course-list-teaching_list-course_name")[0]
        .getElementsByTagName("a")[1].innerText,
      onClick: () => {
        course
          .getElementsByClassName(
            "lms-course-list-teaching_list-course_name"
          )[0]
          .getElementsByTagName("a")[1]
          .click()
      },
      classRoom: (
        course.getElementsByClassName(
          "lms-course-list-teaching_list-room"
        )[0] as HTMLElement
      ).innerText,
      instructor: (
        course.getElementsByClassName(
          "lms-course-list-teaching_list-teacher"
        )[0] as HTMLElement
      ).innerText,
      department: (
        course.getElementsByClassName(
          "lms-course-list-teaching_list-department"
        )[0] as HTMLElement
      ).innerText.replace(/-:(.*)/, "$1")
    }
    return courseInfo
  })
  console.log(courseInfoList)
  return (
    <div>
      <button
        onClick={(e) => {
          courseInfoList[0].onClick()
          console.log("clicked", courseInfoList[0].onClick)
        }}>
        {courseInfoList[0].courseName}
      </button>
    </div>
  )
}
