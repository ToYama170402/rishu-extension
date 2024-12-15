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

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
  element: document.getElementById("test")!,
  insertPosition: "beforebegin"
})
export default () => {
  const target = document.getElementsByClassName(
    "module-toggle-panel__body-inner"
  )[1]! as HTMLElement
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
  const [isDisplayWeekend, setIsDisplayWeekend] = useState(false)
  const uniqueYears = Array.from(
    new Set(courseInfoList.map((course) => course.yearQuoter.year))
  ).sort()
  const uniqueQuoters = [1, 2, 3, 4]
  const isEveningPeriod = courseInfoList.some(
    (course) => course.datePeriod.period > 5
  )
  return (
    <div className="bg-white-dark w-full p-7">
      <Tabs.Root
        defaultValue={uniqueYears[0].toString()}
        className="flex w-full flex-col-reverse">
        <Tabs.List className="ml-5 flex leading-none">
          {uniqueYears.map((year) => (
            <Tabs.Trigger
              value={year.toString()}
              className="radix-state-active:bg-white radix-state-active:border-t-acanthus bg-white-dark mr-2 mt-1 block rounded border-solid p-1 leading-none shadow-lg"
              key={year}>
              {year}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {uniqueYears.map((year) => (
          <Tabs.Content
            value={year.toString()}
            key={year}
            className="bg-white p-3 shadow-lg">
            <Tabs.Root
              defaultValue={uniqueQuoters[0].toString()}
              className="w-full">
              <Tabs.List className="ml-3 flex">
                {uniqueQuoters.map((quoter) => (
                  <Tabs.Trigger
                    value={quoter.toString()}
                    className="radix-state-active:border-b-2 radix-state-active:border-acanthus mr-2 block leading-none transition hover:border-b-2 hover:border-acanthus"
                    key={quoter}>
                    {quoter}Q
                  </Tabs.Trigger>
                ))}
                <button
                  className="text-white mb-2 ml-auto mr-0 block rounded bg-acanthus p-1 px-3 text-xs font-bold transition hover:bg-opacity-60"
                  onClick={() => setIsDisplayWeekend(!isDisplayWeekend)}>
                  {isDisplayWeekend ? "土日非表示" : "土日表示"}
                </button>
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
                    yArray={
                      isEveningPeriod ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5]
                    }
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
    </div>
  )
}
