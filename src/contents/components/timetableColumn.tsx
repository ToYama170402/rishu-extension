import utcDayToJa from "~contents/util/dayNumToJa"

import { type RenderColumnProps } from "./timetable"

export default ({ xFragment, children }: RenderColumnProps) => {
  const isDay =
    utcDayToJa(new Date().getDay()! as 0 | 1 | 2 | 3 | 4 | 5 | 6) === xFragment

  return (
    <div
      className={
        "border-gray-300 flex-1 border-r border-solid px-3 first:pl-0 last:border-r-0 last:pr-0"
      }>
      <div
        className={`mx-auto block size-6 text-center font-bold ${isDay ? "text-white rounded-full bg-acanthus" : ""}`}>
        {xFragment}
      </div>
      <div className="timetable-column-body">{children}</div>
    </div>
  )
}
