import { useState } from "react"

import { type RenderColumnProps } from "./timetable"

export default ({ xFragment, children }: RenderColumnProps) => {
  const [isDisplay, setIsDisplay] = useState(true)
  const handleClick = () => {
    setIsDisplay(!isDisplay)
    console.log(isDisplay)
  }
  return (
    <div
      className={`${isDisplay ? "block" : "hidden"} border-gray-600 flex-1 border-r border-solid pl-3 pr-3 last:border-r-0`}>
      <div className="relative text-center font-bold">
        <button onClick={() => handleClick()} className="absolute right-0">
          ✕
        </button>
        {xFragment}
      </div>
      <div className="timetable-column-body">{children}</div>
    </div>
  )
}
