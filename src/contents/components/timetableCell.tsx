import { type RenderCellProps } from "~contents/components/timetable"
import { type course } from "~contents/type"

export default ({ yFragment, dataFragment }: RenderCellProps<course>) => {
  return (
    <div className="mt-2 h-[1.5em] overflow-hidden">
      <a
        onClick={() => dataFragment.onClick()}
        className="text-acanthus-bright cursor-pointer">
        {dataFragment?.courseName}
      </a>
    </div>
  )
}