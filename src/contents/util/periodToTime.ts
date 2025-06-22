export default (period: number): { startTime: Date; endTime: Date } => {
  const day = new Date()
  // カードタッチ端末を基準
  switch (period) {
    case 1:
      return {
        startTime: new Date(day.setHours(8, 45, 0)),
        endTime: new Date(day.setHours(10, 15, 0))
      }
    case 2:
      return {
        startTime: new Date(day.setHours(10, 30, 0)),
        endTime: new Date(day.setHours(12, 0, 0))
      }
    case 3:
      return {
        startTime: new Date(day.setHours(13, 0, 0)),
        endTime: new Date(day.setHours(14, 30, 0))
      }
    case 4:
      return {
        startTime: new Date(day.setHours(14, 45, 0)),
        endTime: new Date(day.setHours(16, 15, 0))
      }
    case 5:
      return {
        startTime: new Date(day.setHours(16, 30, 0)),
        endTime: new Date(day.setHours(18, 0, 0))
      }
    case 6:
      return {
        startTime: new Date(day.setHours(18, 15, 0)),
        endTime: new Date(day.setHours(19, 45, 0))
      }
    case 7:
      return {
        startTime: new Date(day.setHours(20, 0, 0)),
        endTime: new Date(day.setHours(21, 15, 0))
      }
  }
}
