import { type RenderColumnProps } from "./timetable"

export default ({ xFragment, children }: RenderColumnProps) => {
  return (
    <div className="timetable-column">
      <div className="timetable-column-header">{xFragment}</div>
      <div className="timetable-column-body">{children}</div>
    </div>
  )
}
