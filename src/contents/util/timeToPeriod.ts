export default (time: Date): number => {
  const hour = time.getHours()
  const minute = time.getMinutes()
  // カードタッチ端末を基準
  switch (true) {
    case hour >= 8 && minute >= 0 && hour <= 10 && minute < 20:
      return 1
    case hour >= 10 && minute >= 20 && hour <= 12 && minute < 5:
      return 2
    case hour >= 12 && minute >= 5 && hour <= 14 && minute < 35:
      return 3
    case hour >= 14 && minute >= 35 && hour <= 16 && minute < 20:
      return 4
    case hour >= 16 && minute >= 20 && hour <= 18 && minute < 5:
      return 5
    case hour >= 18 && minute >= 5 && hour <= 19 && minute < 50:
      return 6
    case hour >= 19 && minute >= 50 && hour <= 21 && minute < 20:
      return 7
    default:
      return 0
  }
}
