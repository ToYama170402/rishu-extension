import { Holiday, ScheduleChange } from "./courseList"

// Test the schedule change and holiday logic
describe("Schedule Change and Holiday Logic", () => {
  const holidays: Holiday[] = [
    { date: "2024-01-01", summary: "元日" },
    { date: "2024-07-15", summary: "海の日" }
  ]

  const scheduleChanges: ScheduleChange[] = [
    {
      id: "1",
      date: "2024-07-03",
      fromDay: "月",
      toDay: "火",
      description: "祝日振替授業"
    }
  ]

  test("should identify holidays correctly", () => {
    const isHoliday = (date: string): boolean => {
      return holidays.some((holiday) => holiday.date === date)
    }

    expect(isHoliday("2024-01-01")).toBe(true)
    expect(isHoliday("2024-07-15")).toBe(true)
    expect(isHoliday("2024-07-16")).toBe(false)
  })

  test("should find schedule changes correctly", () => {
    const getScheduleChangeForDate = (date: string): ScheduleChange | null => {
      return scheduleChanges.find((change) => change.date === date) || null
    }

    const change = getScheduleChangeForDate("2024-07-03")
    expect(change).not.toBeNull()
    expect(change?.toDay).toBe("火")
    expect(change?.description).toBe("祝日振替授業")

    const noChange = getScheduleChangeForDate("2024-07-04")
    expect(noChange).toBeNull()
  })

  test("should convert Japanese days to English correctly", () => {
    const convertJapaneseDayToEnglish = (jpDay: string): string => {
      const dayConversion = {
        月: "Mon",
        火: "Tue",
        水: "Wed",
        木: "Thu",
        金: "Fri",
        土: "Sat",
        日: "Sun"
      }
      return dayConversion[jpDay] || jpDay
    }

    expect(convertJapaneseDayToEnglish("月")).toBe("Mon")
    expect(convertJapaneseDayToEnglish("火")).toBe("Tue")
    expect(convertJapaneseDayToEnglish("日")).toBe("Sun")
  })

  test("should handle day number mappings correctly", () => {
    const japDayToNum = {
      月: 1,
      火: 2,
      水: 3,
      木: 4,
      金: 5,
      土: 6,
      日: 0
    }
    const engDayToNum = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 0
    }

    expect(japDayToNum["月"]).toBe(engDayToNum["Mon"])
    expect(japDayToNum["火"]).toBe(engDayToNum["Tue"])
    expect(japDayToNum["日"]).toBe(engDayToNum["Sun"])
  })

  test("should determine when to create events with schedule changes", () => {
    // Test scenario: Tuesday course should be created on July 3rd because it's changed to Tuesday schedule
    const course = { day: "Tue" } // Tuesday course
    const testDate = "2024-07-03" // Wednesday, but has schedule change to Tuesday
    const scheduleDateObj = new Date(testDate)
    const currentDay = scheduleDateObj.getDay() // 3 (Wednesday)

    const getScheduleChangeForDate = (date: string): ScheduleChange | null => {
      return scheduleChanges.find((change) => change.date === date) || null
    }

    const isHoliday = (date: string): boolean => {
      return holidays.some((holiday) => holiday.date === date)
    }

    // Check if holiday
    if (isHoliday(testDate)) {
      expect(false).toBe(true) // Should not reach here for this test
    }

    // Check schedule change
    const scheduleChange = getScheduleChangeForDate(testDate)
    let shouldCreateEvent = false

    if (scheduleChange) {
      // Schedule change logic: Tuesday course should be created on a day that's changed to Tuesday schedule
      const courseEnglishDay = course.day // 'Tue'
      const courseDayNum = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 0
      }[courseEnglishDay]
      const changeToDayNum = {
        月: 1,
        火: 2,
        水: 3,
        木: 4,
        金: 5,
        土: 6,
        日: 0
      }[scheduleChange.toDay]
      shouldCreateEvent = changeToDayNum === courseDayNum
    }

    expect(shouldCreateEvent).toBe(true) // Tuesday course should be created on July 3rd (changed to Tuesday schedule)
  })

  test("should handle holiday exclusion", () => {
    const isHoliday = (date: string): boolean => {
      return holidays.some((holiday) => holiday.date === date)
    }

    // Monday course on a holiday should be skipped
    const holidayDate = "2024-01-01" // New Year's Day
    const shouldSkip = isHoliday(holidayDate)
    expect(shouldSkip).toBe(true)

    // Monday course on a regular Monday should be created
    const regularDate = "2024-01-08" // Regular Monday
    const shouldCreate = !isHoliday(regularDate)
    expect(shouldCreate).toBe(true)
  })
})
