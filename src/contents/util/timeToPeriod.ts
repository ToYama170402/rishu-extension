export default (time: Date): number => {
  const day = new Date(time)
  // カードタッチ端末を基準
  switch (true) {
    case time >= new Date(day.setHours(8, 0, 0)) &&
      time <= new Date(day.setHours(10, 19, 0)):
      return 1
    case time >= new Date(day.setHours(10, 20, 0)) &&
      time <= new Date(day.setHours(12, 4, 0)):
      return 2
    case time >= new Date(day.setHours(12, 5, 0)) &&
      time <= new Date(day.setHours(14, 34, 0)):
      return 3
    case time >= new Date(day.setHours(14, 35, 0)) &&
      time <= new Date(day.setHours(16, 19, 0)):
      return 4
    case time >= new Date(day.setHours(16, 20, 0)) &&
      time <= new Date(day.setHours(18, 4, 0)):
      return 5
    case time >= new Date(day.setHours(18, 5, 0)) &&
      time <= new Date(day.setHours(19, 49, 0)):
      return 6
    case time >= new Date(day.setHours(19, 50, 0)) &&
      time <= new Date(day.setHours(21, 19, 0)):
      return 7
    case time >= new Date(day.setHours(21, 20, 0)) &&
      time <= new Date(day.setHours(22, 44, 0)):
      return 8
    default:
      throw new Error("Invalid time for period conversion")
  }
}
