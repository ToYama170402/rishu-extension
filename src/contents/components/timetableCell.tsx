import { type RenderCellProps } from "@/contents/components/timetable"
import { type course } from "@/contents/type"
import dayNumToJa from "@/contents/util/dayNumToJa"
import timeToPeriod from "@/contents/util/timeToPeriod"

export default ({ yFragment, dataFragment }: RenderCellProps<course>) => {
  const isThisPeriod =
    timeToPeriod(new Date()) === dataFragment?.datePeriod.period &&
    dayNumToJa(new Date().getDay()! as 0 | 1 | 2 | 3 | 4 | 5 | 6) ===
      dataFragment?.datePeriod.date
  return (
    <div className="mt-2 h-[1.5em] overflow-hidden">
      <a
        onClick={() => dataFragment.onClick()}
        className={`cursor-pointer text-acanthus-bright hover:underline ${isThisPeriod ? "border-l-2 border-acanthus pl-1" : ""}`}>
        {dataFragment?.courseName}
      </a>
    </div>
  )
}
