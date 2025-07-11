import { adjustRegistStatus, registStatus } from "@contents/type/registStatus"

export type registeredCourseElement = {
  element: HTMLElement
  priority: 1 | 2 | 3 | 4 | 5
  status: registStatus | adjustRegistStatus
}
