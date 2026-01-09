import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AppConfig, Difficulty, Question, QuestionType } from "../types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDifficulty = (d: Difficulty): string => {
  switch (d) {
    case Difficulty.RECOGNITION: return "Mức độ Nhận biết (Dễ)";
    case Difficulty.UNDERSTANDING: return "Mức độ Thông hiểu (Trung bình)";
    case Difficulty.APPLICATION: return "Mức độ Vận dụng (Khá)";
    case Difficulty.MIXED: return "Hỗn hợp các mức độ từ Nhận biết đến Vận dụng thấp";
    default: return "Trung bình";
  }
};

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey });
}

// NEW: Fetch topics based on Grade and Lesson
export const getLessonTopics = async (grade: string, lesson: string): Promise<string[]> => {
  const ai = getClient();
  
  const prompt = `
    Tôi là giáo viên Toán đang dạy bộ sách "Kết nối tri thức với cuộc sống".
    Lớp: ${grade}.
    Bài học: ${lesson}.
    
    Hãy liệt kê 4-6 dạng toán hoặc chủ đề kiến thức trọng tâm nhất của bài học này để tôi soạn đề kiểm tra.
    Chỉ trả về danh sách tên chủ đề, ngắn gọn, súc tích.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      }
    });

    const rawData = response.text;
    if (!rawData) return [];
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error fetching topics:", error);
    return ["Lý thuyết chung", "Bài tập tính toán", "Bài tập vận dụng"]; // Fallback
  }
};

export const generateQuestions = async (config: AppConfig): Promise<Question[]> => {
  const ai = getClient();

  // Stronger instruction for JSON escaping
  const systemInstruction = `
    Bạn là một chuyên gia sư phạm Toán học, chuyên soạn đề theo bộ sách giáo khoa "Kết nối tri thức với cuộc sống" (Việt Nam).
    
    QUY TẮC ĐỊNH DẠNG (BẮT BUỘC TUÂN THỦ):
    1. Trả về định dạng JSON thuần túy.
    2. Cú pháp Toán học (QUAN TRỌNG: ESCAPE BACKSLASH):
       - Mọi công thức toán, biến số (x, y...), số mũ, căn thức, phân số phải viết bằng mã LaTeX bên trong thẻ <math>...</math>.
       - VÌ ĐÂY LÀ JSON, BẠN PHẢI DÙNG HAI DẤU GẠCH CHÉO NGƯỢC (DOUBLE BACKSLASH) CHO CÁC LỆNH LATEX.
       - Sai: "\\frac{1}{2}" (JSON hiểu là ký tự Form Feed).
       - Đúng: "\\\\frac{1}{2}" (JSON hiểu là chuỗi "\\frac{1}{2}").
       - Tương tự: "\\\\sqrt", "\\\\alpha", "\\\\beta", "\\\\infty"...
       - Ví dụ: "Tính <math>A = 2^{3} + \\\\frac{1}{2}</math>"
    3. Nội dung:
       - Bám sát chương trình sách giáo khoa "Kết nối tri thức".
       - Số liệu "đẹp", dễ tính toán.
  `;

  const prompt = `
    Hãy tạo ${config.quantity} câu hỏi Toán Lớp ${config.grade}.
    Bài học: ${config.lesson}.
    Tập trung vào các chủ đề kiến thức sau: ${config.topics.join(', ')}.
    Độ khó: ${formatDifficulty(config.difficulty)}.
    Loại câu hỏi ưu tiên: ${config.questionTypes.join(', ')}.

    Yêu cầu chi tiết từng loại:
    - Nếu là Trắc nghiệm (MCQ): Cần 4 đáp án (A, B, C, D).
    - Nếu là Đúng/Sai: 2 đáp án.
    
    Hãy đảm bảo trường "content" chứa câu hỏi, "options" chứa các lựa chọn (nếu có), "correctOptionId" là id của đáp án đúng, và "explanation" là lời giải chi tiết (cũng áp dụng quy tắc thẻ <math> chứa LaTeX với double backslash).
  `;

  // Define response schema strictly
  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "Nội dung câu hỏi với LaTeX trong thẻ <math>" },
        type: { type: Type.STRING, enum: [QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.SHORT_ANSWER, QuestionType.ESSAY] },
        options: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              content: { type: Type.STRING, description: "Nội dung đáp án với LaTeX trong thẻ <math>" }
            }
          }
        },
        correctOptionId: { type: Type.STRING },
        shortAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING, description: "Lời giải chi tiết với LaTeX trong thẻ <math>" }
      },
      required: ["content", "type", "explanation"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: config.model, // Updated to use selected model
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const rawData = response.text;
    if (!rawData) throw new Error("No data returned from AI");

    const parsedQuestions = JSON.parse(rawData);

    // Hydrate with local IDs just in case
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return parsedQuestions.map((q: any) => ({
      ...q,
      id: generateId(),
      options: q.options ? q.options.map((opt: any) => ({ ...opt, id: opt.id || generateId() })) : []
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Không thể tạo câu hỏi. Vui lòng thử lại.");
  }
};