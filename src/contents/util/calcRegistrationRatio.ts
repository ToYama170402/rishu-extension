import { registStatus } from "~contents/type/registStatus"

export function calcApplicantsRatio(applicantsAmount: registStatus): number[] {
  const applicants = [
    applicantsAmount.primaryRegistNumber,
    applicantsAmount.firstRegistNumber - applicantsAmount.primaryRegistNumber,
    applicantsAmount.secondRegistNumber,
    applicantsAmount.thirdRegistNumber,
    applicantsAmount.fourthRegistNumber,
    applicantsAmount.fifthRegistNumber
  ]
  let ratio: number[] = []
  let excess = applicantsAmount.properNumber
  applicants.forEach((a) => {
    if (excess >= a && excess > 0) {
      ratio.push(1)
      excess -= a
    } else {
      ratio.push(a === 0 ? 0 : excess / a)
      excess = 0
    }
  })
  return ratio
}
