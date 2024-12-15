export default (num: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
  switch (num) {
    case 0:
      return "日"
    case 1:
      return "月"
    case 2:
      return "火"
    case 3:
      return "水"
    case 4:
      return "木"
    case 5:
      return "金"
    case 6:
      return "土"
  }
}
