import { type RenderColumnProps } from "./timetable"

export default ({ xFragment, children }: RenderColumnProps) => {
  return (
    <div
      className={
        "border-gray-600 flex-1 border-r border-solid pl-3 pr-3 last:border-r-0"
      }>
      <div className="relative text-center font-bold">{xFragment}</div>
      <div className="timetable-column-body">{children}</div>
    </div>
  )
}
