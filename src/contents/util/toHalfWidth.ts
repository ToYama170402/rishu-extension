export default (str: string) => {
  return str
    .replace(/[！-～]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    )
    .replace(/　/g, " ")
}
