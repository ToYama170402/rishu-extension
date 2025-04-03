import { parse } from "path"
import { adjustRegistStatus, registStatus } from "@contents/type/registStatus"

import parseDayPeriod from "./parseDayPeriod"

export default function arrayToRegistStatus(
  registStatusArray: string[][]
): registStatus[] | adjustRegistStatus[] {
  if (registStatusArray[0].length === 14) {
    return registStatusArray.map((registStatus) => {
      const course: registStatus = {
        course: {
          dayPeriod: parseDayPeriod(registStatus[3]),
          courseNumber: registStatus[0],
          courseName: registStatus[2],
          teacher: registStatus[4],
          courseType: registStatus[1],
          targetStudent: registStatus[5]
        },
        properNumber: parseInt(registStatus[6]),
        allRegistNumber: parseInt(registStatus[7]),
        primaryRegistNumber: parseInt(registStatus[8]),
        firstRegistNumber: parseInt(registStatus[9]),
        secondRegistNumber: parseInt(registStatus[10]),
        thirdRegistNumber: parseInt(registStatus[11]),
        fourthRegistNumber: parseInt(registStatus[12]),
        fifthRegistNumber: parseInt(registStatus[13])
      }
      return course
    })
  } else if (registStatusArray[0].length === 9) {
    return registStatusArray.map((registStatus) => {
      const course: adjustRegistStatus = {
        course: {
          dayPeriod: parseDayPeriod(registStatus[3]),
          courseNumber: registStatus[0],
          courseName: registStatus[2],
          teacher: registStatus[4],
          courseType: registStatus[1],
          targetStudent: registStatus[5]
        },
        properNumber: parseInt(registStatus[6]),
        registeredNumber: parseInt(registStatus[7])
      }
      return course
    })
  }
}
