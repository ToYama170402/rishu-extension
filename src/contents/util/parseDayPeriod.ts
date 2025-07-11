import { dayPeriods } from "@contents/type/course"

import toHalfWidth from "./toHalfWidth"

export default function parseDayPeriod(dayPeriodString: string): dayPeriods {
  if (dayPeriodString.length === 0) return []
  return toHalfWidth(dayPeriodString)
    .split(/[,，、]/)
    .map((dayPeriod) => {
      if (dayPeriod.length === 0) return []

      if (dayPeriod === "集中") return "集中"

      const periodRange = dayPeriod
        .slice(1)
        .split(/[~〜～]/)
        .map((period) => Number(period))

      if (periodRange.length === 1) {
        return {
          day: dayPeriod[0] as "月" | "火" | "水" | "木" | "金" | "土",
          period: periodRange[0] as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
        }
      } else {
        const startPeriod: number = periodRange[0]
        const endPeriod: number = periodRange[1]

        return Array.from(
          { length: endPeriod - startPeriod + 1 },
          (_, i) => startPeriod + i
        ).map((period) => ({
          day: dayPeriod[0] as "月" | "火" | "水" | "木" | "金" | "土",
          period: Number(period) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
        }))
      }
    })
    .flat()
}
