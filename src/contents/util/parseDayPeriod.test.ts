import parseDayPeriod from "./parseDayPeriod"

describe("parseDayPeriod", () => {
  test("should parse a single day period correctly", () => {
    const result = parseDayPeriod("月1~3")
    expect(result).toEqual([
      { day: "月", period: 1 },
      { day: "月", period: 2 },
      { day: "月", period: 3 }
    ])
  })

  test("should parse multiple day periods correctly", () => {
    const result = parseDayPeriod("火2,水3~4")
    expect(result).toEqual([
      { day: "火", period: 2 },
      { day: "水", period: 3 },
      { day: "水", period: 4 }
    ])
  })

  test("should parse a single period correctly", () => {
    const result = parseDayPeriod("木5")
    expect(result).toEqual([{ day: "木", period: 5 }])
  })

  test("should parse a intensive course correctly", () => {
    const result = parseDayPeriod("集中")
    expect(result).toEqual(["集中"])
  })

  test("should handle empty input", () => {
    const result = parseDayPeriod("")
    expect(result).toEqual([])
  })

  test("should parse mixed input with intensive course and day periods", () => {
    const result = parseDayPeriod("集中,金1~2,土3")
    expect(result).toEqual([
      "集中",
      { day: "金", period: 1 },
      { day: "金", period: 2 },
      { day: "土", period: 3 }
    ])
  })

  test("should handle input with full-width characters", () => {
    const result = parseDayPeriod("月１〜３、火４")
    expect(result).toEqual([
      { day: "月", period: 1 },
      { day: "月", period: 2 },
      { day: "月", period: 3 },
      { day: "火", period: 4 }
    ])
  })

  test("should handle input with inconsistent delimiters", () => {
    const result = parseDayPeriod("水1~2,木3、金4")
    expect(result).toEqual([
      { day: "水", period: 1 },
      { day: "水", period: 2 },
      { day: "木", period: 3 },
      { day: "金", period: 4 }
    ])
  })

  test("should return an empty array for invalid period range", () => {
    const result = parseDayPeriod("月3~1")
    expect(result).toEqual([])
  })

  test("should handle input with trailing delimiters", () => {
    const result = parseDayPeriod("火2~3,")
    expect(result).toEqual([
      { day: "火", period: 2 },
      { day: "火", period: 3 }
    ])
  })
  test("should parse mixed input with intensive course and day periods", () => {
    const result = parseDayPeriod("集中,金1~2,土3")
    expect(result).toEqual([
      "集中",
      { day: "金", period: 1 },
      { day: "金", period: 2 },
      { day: "土", period: 3 }
    ])
  })

  test("should handle input with full-width characters", () => {
    const result = parseDayPeriod("月１〜３、火４")
    expect(result).toEqual([
      { day: "月", period: 1 },
      { day: "月", period: 2 },
      { day: "月", period: 3 },
      { day: "火", period: 4 }
    ])
  })

  test("should handle input with inconsistent delimiters", () => {
    const result = parseDayPeriod("水1~2,木3、金4")
    expect(result).toEqual([
      { day: "水", period: 1 },
      { day: "水", period: 2 },
      { day: "木", period: 3 },
      { day: "金", period: 4 }
    ])
  })

  test("should return an empty array for invalid period range", () => {
    const result = parseDayPeriod("月3~1")
    expect(result).toEqual([])
  })

  test("should handle input with trailing delimiters", () => {
    const result = parseDayPeriod("火2~3,")
    expect(result).toEqual([
      { day: "火", period: 2 },
      { day: "火", period: 3 }
    ])
  })
})
