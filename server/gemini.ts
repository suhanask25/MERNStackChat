import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeMedicalReport(filePath: string, mimeType: string): Promise<any> {
  try {
    const fileBytes = fs.readFileSync(filePath);
    
    const contents = [
      {
        inlineData: {
          data: fileBytes.toString("base64"),
          mimeType: mimeType,
        },
      },
      `You are a medical data extraction expert. Analyze this medical report and extract ALL key health parameters.

Extract the following information in a structured JSON format:
{
  "parameters": [
    {
      "name": "parameter name (e.g., TSH, Free T3, Free T4, LH, FSH, Testosterone, Insulin, etc.)",
      "value": "numeric value only",
      "unit": "unit of measurement",
      "referenceRange": "normal range if shown",
      "status": "Normal/High/Low based on reference range"
    }
  ],
  "reportType": "type of test (e.g., Thyroid Panel, Hormone Panel, PCOS Markers, etc.)",
  "testDate": "date of test if available",
  "summary": "brief 1-2 sentence summary of key findings"
}

Focus especially on:
- Thyroid markers (TSH, T3, T4, Free T3, Free T4)
- PCOS/PCOD markers (LH, FSH, Testosterone, DHEA-S, Prolactin, AMH)
- Metabolic markers (Insulin, Glucose, HbA1c, Lipid panel)
- Hormone levels (Estrogen, Progesterone)
- Vitamin levels (Vitamin D, B12)

Be thorough and extract ALL parameters you can find. If a reference range is provided, determine if the value is Normal, High, or Low.`,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        responseMimeType: "application/json",
      },
      contents: contents,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new Error(`Failed to analyze medical report: ${error}`);
  }
}

export async function calculateRiskScore(
  extractedData: any,
  assessmentAnswers: Record<string, string | number>
): Promise<{ score: number; riskLevel: string; interpretation: string }> {
  try {
    const prompt = `You are a women's health risk assessment expert. Based on the following medical data and symptom assessment, calculate a health risk score.

Medical Data:
${JSON.stringify(extractedData, null, 2)}

Assessment Answers:
${JSON.stringify(assessmentAnswers, null, 2)}

Analyze this data and provide a risk assessment in JSON format:
{
  "score": number between 0-100 (0 = very low risk, 100 = very high risk),
  "riskLevel": "Low" or "Moderate" or "High",
  "interpretation": "A clear, supportive 2-3 sentence explanation of what this score means and what the person should consider. Be encouraging and constructive."
}

Consider:
- Hormonal imbalances indicating PCOS/PCOD risk
- Thyroid dysfunction markers
- Metabolic health indicators
- Symptom severity and frequency
- Lifestyle factors

Provide a balanced, medically-informed assessment.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            riskLevel: { type: "string" },
            interpretation: { type: "string" },
          },
          required: ["score", "riskLevel", "interpretation"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error('Risk calculation error:', error);
    throw new Error(`Failed to calculate risk score: ${error}`);
  }
}

export async function generateDailyTasks(
  extractedData: any,
  riskScore: { score: number; riskLevel: string }
): Promise<Array<{ taskType: string; description: string; target?: string }>> {
  try {
    const prompt = `You are a personalized health coach for women. Based on this medical data and risk assessment, create 4-6 specific, actionable daily health tasks.

Medical Data:
${JSON.stringify(extractedData, null, 2)}

Risk Score: ${riskScore.score}/100 (${riskScore.riskLevel})

Generate daily wellness tasks in JSON format:
[
  {
    "taskType": "water" or "exercise" or "medication" or "protein" or "sleep" or "stress",
    "description": "Clear, specific task description",
    "target": "Specific measurable target (e.g., '2 liters', '30 minutes', '100g')"
  }
]

Create practical, achievable tasks that address:
- Hydration (if needed)
- Physical activity appropriate to their condition
- Dietary recommendations (especially protein, anti-inflammatory foods)
- Stress management
- Sleep quality
- Any medication reminders based on their condition

Make tasks supportive, specific, and encouraging. Focus on what will help their specific health concerns.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error('Task generation error:', error);
    throw new Error(`Failed to generate daily tasks: ${error}`);
  }
}

export async function generateInsights(
  extractedData: any,
  assessmentAnswers: Record<string, string | number>
): Promise<Array<{ category: string; title: string; content: string; severity?: string }>> {
  try {
    const prompt = `You are a compassionate women's health educator. Based on this medical data and assessment, generate 3-5 personalized health insights.

Medical Data:
${JSON.stringify(extractedData, null, 2)}

Assessment Answers:
${JSON.stringify(assessmentAnswers, null, 2)}

Generate insights in JSON format:
[
  {
    "category": "Hormonal" or "Metabolic" or "Lifestyle" or "Thyroid" or "Nutrition",
    "title": "Brief, clear insight title (5-8 words)",
    "content": "Supportive, educational explanation (2-3 sentences) about what this means and what they can do about it. Be encouraging and actionable.",
    "severity": "Info" or "Warning" or "Important" (optional)
  }
]

Focus on:
- Key findings from their lab results
- Patterns in their symptoms
- Lifestyle factors that may be contributing
- Actionable recommendations
- Educational information about their conditions

Be supportive, clear, and empowering. Avoid medical jargon. Make it practical and hopeful.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error('Insight generation error:', error);
    throw new Error(`Failed to generate insights: ${error}`);
  }
}
