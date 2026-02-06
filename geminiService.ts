
import { GoogleGenAI } from "@google/genai";
import { LogEntry } from "./types";

export const analyzeAttendance = async (logs: LogEntry[]): Promise<string> => {
  // Always initialize GoogleGenAI with a named parameter using the pre-configured API_KEY.
  // We create a new instance inside the function to ensure the most up-to-date key state is utilized.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) return "الذكاء الاصطناعي غير متوفر حالياً.";

  const prompt = `
    حلل سجلات الحضور التالية لشركة مقاولات وقدم تقريراً موجزاً جداً (باللغة العربية):
    السجلات: ${JSON.stringify(logs.map(l => ({ name: l.name, time: l.timestamp, type: l.type, status: l.status })))}
    
    المطلوب:
    1. عدد الحاضرين والغياب.
    2. ملاحظات حول التأخير أو التواجد خارج الموقع.
    3. نصيحة سريعة للمدير.
  `;

  try {
    // Correctly call generateContent using both model name and prompt in a single object.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Correctly extract text output using the .text property (getter).
    return response.text || "فشل في تحليل البيانات.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء تحليل البيانات.";
  }
};
