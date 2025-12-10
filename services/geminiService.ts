import { GoogleGenAI, Type } from "@google/genai";
import { ReportData } from "../types";

const SYSTEM_INSTRUCTION = `
Anda adalah konsultan pendidikan anak usia dini (PAUD/TK) yang ahli. 
Tugas anda adalah membuat narasi laporan perkembangan anak (Rapor) untuk TK Islam.
Gunakan bahasa Indonesia yang formal, sopan, mengapresiasi, dan mudah dipahami orang tua.
Buatlah narasi yang RINGKAS, PADAT, dan JELAS.
Fokus pada kekuatan anak, namun tetap memberikan saran stimulasi yang konstruktif.
Hindari kata-kata negatif. Gunakan pendekatan "Sandwich" (Pujian - Saran - Pujian).
Karena ini TK Islam, selipkan nilai-nilai keislaman jika relevan pada bagian karakter atau agama.
`;

export const generateReportNarrative = async (data: ReportData): Promise<{ narrative: string; teacherNote: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a simplified prompt payload to save tokens and focus the model
  const promptPayload = {
    studentName: data.student.name,
    semester: data.student.semester,
    developmentScores: data.cppa.map(i => ({ scope: i.scope, level: i.level })),
    characterScores: data.character.map(c => ({ aspect: c.aspect, score: c.score })),
    dailyHighlights: data.dailyActivities.map(d => ({ activity: d.activity, grade: d.grade })),
  };

  const prompt = `
    Buatkan narasi rapor untuk murid berikut:
    ${JSON.stringify(promptPayload, null, 2)}

    Output yang diminta adalah JSON dengan format:
    1. "narrative": Deskripsi perkembangan yang RINGKAS dan PADAT (maksimal 1 paragraf atau sekitar 5-8 kalimat saja). Rangkum capaian terbaik dan area yang perlu stimulasi menjadi satu kesatuan yang mengalir. Jangan bertele-tele.
    2. "teacherNote": Catatan Wali Kelas (singkat, 1-2 kalimat motivasi).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            teacherNote: { type: Type.STRING },
          },
          required: ["narrative", "teacherNote"]
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      narrative: result.narrative || "Gagal menghasilkan narasi.",
      teacherNote: result.teacherNote || "Gagal menghasilkan catatan."
    };

  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};