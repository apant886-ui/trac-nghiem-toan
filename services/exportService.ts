import { ExamExportConfig, Question, QuestionType } from "../types";

/**
 * Converts internal HTML format (<math>...</math>) to Word-friendly format ($...$).
 * This assumes the user might use a plugin or simply wants clear delimiters.
 * Native Equation MathML for Word is complex to generate raw, so LaTeX-style delimiters ($) 
 * are the standard "universal" exchange format for Math teachers using tools like Mathtype/LaTeX.
 */
const convertMathTags = (html: string): string => {
  if (!html) return "";
  // Replace <math>...</math> with $...$
  return html.replace(/<math>(.*?)<\/math>/g, ' $$ $1 $$ ');
};

const generateExamHTML = (questions: Question[], variantCode: string, config: ExamExportConfig): string => {
  let bodyContent = `
    <div class="header" style="text-align: center; margin-bottom: 20px;">
      <p style="font-weight: bold; font-size: 14pt; margin: 0;">${config.schoolName.toUpperCase()}</p>
      <p style="font-weight: bold; font-size: 16pt; margin: 10px 0;">${config.examTitle.toUpperCase()}</p>
      <p>Mã đề: <b>${variantCode}</b></p>
    </div>
    <hr/>
    <div class="content">
  `;

  questions.forEach((q, index) => {
    bodyContent += `<div style="margin-bottom: 15px;">`;
    bodyContent += `<p><b>Câu ${index + 1}:</b> ${convertMathTags(q.content)}</p>`;

    if (q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE) {
      bodyContent += `<div style="margin-left: 20px;">`;
      q.options?.forEach((opt, idx) => {
        const label = String.fromCharCode(65 + idx); // A, B, C, D
        bodyContent += `<p style="margin: 5px 0;"><b>${label}.</b> ${convertMathTags(opt.content)}</p>`;
      });
      bodyContent += `</div>`;
    } else if (q.type === QuestionType.SHORT_ANSWER) {
      bodyContent += `<p><i>Trả lời: ..............................................................</i></p>`;
    } else {
       bodyContent += `<p><i>(Học sinh trình bày lời giải chi tiết vào giấy làm bài)</i></p>`;
    }
    bodyContent += `</div>`;
  });

  bodyContent += `</div>`; // Close content

  // Add Answer Key & Explanations at the end (Page Break)
  bodyContent += `<br clear="all" style="page-break-before:always" />`;
  bodyContent += `<h2 style="text-align: center;">ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT (MÃ ${variantCode})</h2>`;
  
  // Table for Quick Answers
  bodyContent += `<table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;"><tr>`;
  questions.forEach((_, idx) => {
    bodyContent += `<th style="padding: 5px;">${idx + 1}</th>`;
  });
  bodyContent += `</tr><tr>`;
  questions.forEach((q) => {
    let answerText = "-";
    if (q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE) {
        const correctIndex = q.options?.findIndex(o => o.id === q.correctOptionId);
        if (correctIndex !== undefined && correctIndex >= 0) {
             answerText = String.fromCharCode(65 + correctIndex);
        }
    } else if (q.shortAnswer) {
        answerText = convertMathTags(q.shortAnswer);
    }
    bodyContent += `<td style="text-align: center; padding: 5px;">${answerText}</td>`;
  });
  bodyContent += `</tr></table>`;

  // Detailed Explanations
  questions.forEach((q, index) => {
      bodyContent += `<p><b>Câu ${index + 1}:</b> ${convertMathTags(q.explanation)}</p>`;
  });

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${config.examTitle}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
        table, th, td { border: 1px solid black; }
      </style>
    </head>
    <body>${bodyContent}</body>
    </html>
  `;
};

// Shuffle array utility
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const downloadWordFiles = (questions: Question[], config: ExamExportConfig) => {
  for (let i = 0; i < config.numberOfVariants; i++) {
    const variantCode = `10${i + 1}`; // e.g., 101, 102
    
    // For each variant, we shuffle the questions AND shuffle options for MCQs
    let variantQuestions = shuffle(questions);
    variantQuestions = variantQuestions.map(q => {
        if (q.type === QuestionType.MCQ) {
            // Shallow copy options to not affect original state
            const newOptions = q.options ? shuffle(q.options) : [];
            return { ...q, options: newOptions };
        }
        return q;
    });

    const html = generateExamHTML(variantQuestions, variantCode, config);
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `De_Thi_${config.examTitle}_Ma_${variantCode}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};