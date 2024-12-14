import * as Tabs from "@radix-ui/react-tabs"
import cssText from "data-text:@/style.css"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useState } from "react"

import Timetable from "./components/timetable"
import TimetableCell from "./components/timetableCell"
import TimetableColumn from "./components/timetableColumn"
import type { course } from "./type"
import toHalfWidth from "./util/toHalfWidth"

export const config: PlasmoCSConfig = {
  matches: ["https://acanthus.cis.kanazawa-u.ac.jp/base/lms-course/list"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const target = document.getElementsByClassName(
  "module-toggle-panel__body-inner"
)[1]! as HTMLElement

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => target
export default () => {
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
        ).innerText.replace(/.*(月|火|水|木|金|土|日)\/.*/, "$1")! as
          | "月"
          | "火"
          | "水"
          | "木"
          | "金"
          | "土"
          | "日",
        period: parseInt(
          toHalfWidth(
            (
              course.getElementsByClassName(
                "lms-course-list-teaching_list-week_time"
              )[0] as HTMLElement
            ).innerText.replace(/.*\/([1-7１-７])時限/, "$1")
          )
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
  target.style.display = "none"
  const [isDisplayWeekend, setIsDisplayWeekend] = useState(false)
  const uniqueYears = Array.from(
    new Set(courseInfoList.map((course) => course.yearQuoter.year))
  ).sort()
  const uniqueQuoters = [1, 2, 3, 4]
  return (
    <Tabs.Root
      defaultValue={uniqueYears[0].toString()}
      className="mb-6 flex w-full flex-col-reverse">
      <Tabs.List className="ml-2">
        {uniqueYears.map((year) => (
          <Tabs.Trigger value={year.toString()} className="mr-2" key={year}>
            {year}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {uniqueYears.map((year) => (
        <Tabs.Content value={year.toString()} key={year}>
          <Tabs.Root
            defaultValue={uniqueQuoters[0].toString()}
            className="w-full">
            <Tabs.List className="mb-2 ml-3">
              {uniqueQuoters.map((quoter) => (
                <Tabs.Trigger
                  value={quoter.toString()}
                  className="mr-2"
                  key={quoter}>
                  {quoter}Q
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {uniqueQuoters.map((quoter) => (
              <Tabs.Content value={quoter.toString()} key={quoter}>
                <Timetable
                  data={courseInfoList.filter(
                    (course) =>
                      course.yearQuoter.year === year &&
                      course.yearQuoter.quoter === quoter
                  )}
                  xArray={
                    isDisplayWeekend
                      ? ["月", "火", "水", "木", "金", "土", "日"]
                      : ["月", "火", "水", "木", "金"]
                  }
                  yArray={[1, 2, 3, 4, 5, 6, 7]}
                  xKey="datePeriod.date"
                  yKey="datePeriod.period"
                  RenderCell={TimetableCell}
                  RenderColumn={TimetableColumn}
                  className="flex w-full"
                />
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
