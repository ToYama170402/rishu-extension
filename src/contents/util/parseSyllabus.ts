/**
 * シラバスHTMLから主要情報を構造化して抽出する
 * @param html string | Document
 * @returns 構造化されたシラバス情報
 */
export function parseSyllabus(html: string | Document) {
  const doc =
    typeof html === "string"
      ? new DOMParser().parseFromString(html, "text/html")
      : html
  const getText = (selector: string) =>
    doc.querySelector(selector)?.textContent?.trim() || ""

  // 講義スケジュール
  const scheduleTable = doc.querySelector(
    "#ctl00_phContents_Detail_ucLctSchedule_gvRefer"
  )
  let schedule: Array<{
    no: string
    theme: string
    detail: string
    teacher: string
  }> = []
  if (scheduleTable) {
    const rows = Array.from(scheduleTable.querySelectorAll("tr")).slice(1) // skip header
    for (const row of rows) {
      const cells = row.querySelectorAll("td")
      if (cells.length === 4) {
        schedule.push({
          no: cells[0].textContent?.trim() || "",
          theme: cells[1].textContent?.trim() || "",
          detail: cells[2].textContent?.trim() || "",
          teacher: cells[3].textContent?.trim() || ""
        })
      }
    }
  }

  // ルーブリック
  const rubricTable = doc.querySelector(
    "#ctl00_phContents_Detail_cateRubrics_gvRefer"
  )
  let rubric: Array<{
    item: string
    S: string
    A: string
    B: string
    C: string
    F: string
  }> = []
  if (rubricTable) {
    const rows = Array.from(rubricTable.querySelectorAll("tr")).slice(2) // skip header
    for (const row of rows) {
      const cells = row.querySelectorAll("td")
      if (cells.length === 6) {
        rubric.push({
          item: cells[0].textContent?.trim() || "",
          S: cells[1].textContent?.trim() || "",
          A: cells[2].textContent?.trim() || "",
          B: cells[3].textContent?.trim() || "",
          C: cells[4].textContent?.trim() || "",
          F: cells[5].textContent?.trim() || ""
        })
      }
    }
  }

  // 教科書・参考書
  const bookTable = doc.querySelector(
    "#ctl00_phContents_Detail_ItemSyllabusReferenceBook_tdTextBooks > table"
  )
  let books: Array<{
    type: string
    title: string
    author: string
    publisher: string
    year: string
    isbn: string
  }> = []
  if (bookTable) {
    const rows = bookTable.querySelectorAll("tr")
    if (rows.length >= 3) {
      books.push({
        type: getText(
          "#ctl00_phContents_Detail_ItemSyllabusReferenceBook_ItemBookReferenceBook_1_lblTitle_lbl"
        ),
        title: getText(
          "#ctl00_phContents_Detail_ItemSyllabusReferenceBook_ItemBookReferenceBook_1_txtBookName_lbl"
        ),
        author: getText(
          "#ctl00_phContents_Detail_ItemSyllabusReferenceBook_ItemBookReferenceBook_1_txtAuthor_lbl"
        ),
        publisher: getText(
          "#ctl00_phContents_Detail_ItemSyllabusReferenceBook_ItemBookReferenceBook_1_txtPublisher_lbl"
        ),
        year: getText(
          "#ctl00_phContents_Detail_ItemSyllabusReferenceBook_ItemBookReferenceBook_1_txtYear_lbl"
        ),
        isbn: getText(
          "#ctl00_phContents_Detail_ItemSyllabusReferenceBook_ItemBookReferenceBook_1_txtIsbn_lbl"
        )
      })
    }
  }

  return {
    subjectName: getText("#ctl00_phContents_Detail_lbl_lct_name_double"),
    teacher: getText("#ctl00_phContents_Detail_lbl_syl_staff_name_link_double"),
    subjectNumber: getText("#ctl00_phContents_Detail_lbl_numbering"),
    timetableNumber: getText("#ctl00_phContents_Detail_lbl_lct_cd"),
    subjectCategory: getText("#ctl00_phContents_Detail_lbl_sbj_div_name"),
    lectureType: getText("#ctl00_phContents_Detail_lbl_lct_type_name"),
    faculty: getText("#ctl00_phContents_Detail_lbl_faculty_name"),
    classSize: getText("#ctl00_phContents_Detail_lbl_class_size_disp"),
    term: getText("#ctl00_phContents_Detail_lbl_lct_term_name"),
    dayPeriod: getText("#ctl00_phContents_Detail_lbl_day_period"),
    credits: getText("#ctl00_phContents_Detail_lbl_credits_disp"),
    format: getText("#ctl00_phContents_Detail_lbl_format_name_disp"),
    target: getText("#ctl00_phContents_Detail_lbl_target"),
    keyword: getText("#ctl00_phContents_Detail_lbl_keyword_disp"),
    room: getText("#ctl00_phContents_Detail_lbl_lecture_room_infomation"),
    note: getText("#ctl00_phContents_Detail_lbl_note"),
    mainTheme: getText("#ctl00_phContents_Detail_txt_topic_referTxt"),
    objective: getText("#ctl00_phContents_Detail_txt_objective_referTxt"),
    outline: getText("#ctl00_phContents_Detail_txt_outline_referTxt"),
    schedule,
    gradingMethod: getText(
      "#ctl00_phContents_Detail_txt_grading_method_referTxt"
    ),
    gradingRate: getText("#ctl00_phContents_Detail_txt_grading_rate_referTxt"),
    rubric,
    preLearning: getText("#ctl00_phContents_Detail_txt_pre_learning_referTxt"),
    postLearning: getText(
      "#ctl00_phContents_Detail_txt_post_learning_referTxt"
    ),
    books,
    booksNote: getText("#ctl00_phContents_Detail_txt_books_note_referTxt"),
    officeHours: getText("#ctl00_phContents_Detail_txt_office_hours_referTxt"),
    prerequisites: getText(
      "#ctl00_phContents_Detail_txt_prerequisites_referTxt"
    ),
    classSize2: getText("#ctl00_phContents_Detail_txt_class_size_referTxt"),
    adjusting: getText("#ctl00_phContents_Detail_txt_adjusting_referTxt"),
    others: getText("#ctl00_phContents_Detail_txt_others_referTxt"),
    curriculum: getText("#ctl00_phContents_Detail_txt_curriculum_referTxt")
  }
}
