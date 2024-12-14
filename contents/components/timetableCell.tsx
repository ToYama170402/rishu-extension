import { type RenderCellProps } from "~contents/components/timetable"
import { type course } from "~contents/type"

export default ({ yFragment, dataFragment }: RenderCellProps<course>) => {
  return (
    <div className="timetable-cell">
      <div className="timetable-cell-header">{yFragment}</div>
      <div className="timetable-cell-body">{dataFragment.courseName}</div>
    </div>
  )
}
