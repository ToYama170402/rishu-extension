import { type RenderColumnProps } from "./timetable"

export default ({ xFragment, children }: RenderColumnProps) => {
  return (
    <div
      className={
        "border-gray-300 flex-1 border-r border-solid px-3 first:pl-0 last:border-r-0 last:pr-0"
      }>
      <div className="relative text-center font-bold">{xFragment}</div>
      <div className="timetable-column-body">{children}</div>
    </div>
  )
}
