import timeToPeriod from "./timeToPeriod"

describe("timeToPeriod", () => {
  test("returns 1 for times between 08:00 and 10:19", () => {
    expect(timeToPeriod(new Date("2023-10-10T08:00:00"))).toBe(1)
    expect(timeToPeriod(new Date("2023-10-10T10:19:00"))).toBe(1)
  })

  test("returns 2 for times between 10:20 and 12:04", () => {
    expect(timeToPeriod(new Date("2023-10-10T10:20:00"))).toBe(2)
    expect(timeToPeriod(new Date("2023-10-10T12:04:00"))).toBe(2)
  })

  test("returns 3 for times between 12:05 and 14:34", () => {
    expect(timeToPeriod(new Date("2023-10-10T12:05:00"))).toBe(3)
    expect(timeToPeriod(new Date("2023-10-10T14:34:00"))).toBe(3)
  })

  test("returns 4 for times between 14:35 and 16:19", () => {
    expect(timeToPeriod(new Date("2023-10-10T14:35:00"))).toBe(4)
    expect(timeToPeriod(new Date("2023-10-10T16:19:00"))).toBe(4)
  })

  test("returns 5 for times between 16:20 and 18:04", () => {
    expect(timeToPeriod(new Date("2023-10-10T16:20:00"))).toBe(5)
    expect(timeToPeriod(new Date("2023-10-10T18:04:00"))).toBe(5)
  })

  test("returns 6 for times between 18:05 and 19:49", () => {
    expect(timeToPeriod(new Date("2023-10-10T18:05:00"))).toBe(6)
    expect(timeToPeriod(new Date("2023-10-10T19:49:00"))).toBe(6)
  })

  test("returns 7 for times between 19:50 and 21:19", () => {
    expect(timeToPeriod(new Date("2023-10-10T19:50:00"))).toBe(7)
    expect(timeToPeriod(new Date("2023-10-10T21:19:00"))).toBe(7)
  })

  test("returns 0 for times outside defined periods", () => {
    expect(timeToPeriod(new Date("2023-10-10T07:59:00"))).toBe(0)
    expect(timeToPeriod(new Date("2023-10-10T21:20:00"))).toBe(0)
  })
})
