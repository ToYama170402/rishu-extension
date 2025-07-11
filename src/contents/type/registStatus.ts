import { course } from "./course"

export type registStatus = {
  course: course
  properNumber: number
  allRegistNumber: number
  primaryRegistNumber: number
  firstRegistNumber: number
  secondRegistNumber: number
  thirdRegistNumber: number
  fourthRegistNumber: number
  fifthRegistNumber: number
}

export type adjustRegistStatus = {
  course: course
  properNumber: number
  registeredNumber: number
}
