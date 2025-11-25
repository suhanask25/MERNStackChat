import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeMedicalReport(filePath: string, mimeType: string): Promise<any> {
  try {
    const ai = getAIClient();
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
    const ai = getAIClient();
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
    const ai = getAIClient();
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
    const ai = getAIClient();
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

const HEALTH_KNOWLEDGE_BASE: Record<string, string> = {
  pcos: "PCOS management involves a multi-faceted approach:\n\n1. **Lifestyle Modifications:**\n   - Regular exercise: Aim for 150 minutes moderate cardio + 2-3 strength training sessions weekly\n   - Diet: Focus on low glycemic index foods, lean proteins, and healthy fats\n   - Stress management: Practice yoga, meditation, or deep breathing\n\n2. **Nutrition Tips:**\n   - Increase fiber intake (whole grains, vegetables)\n   - Limit processed foods and sugary drinks\n   - Include omega-3 rich foods (fish, flaxseeds, walnuts)\n   - Stay hydrated with water\n\n3. **Regular Monitoring:**\n   - Get insulin and glucose levels checked\n   - Monitor hormonal levels as recommended by doctor\n   - Track symptoms and cycles\n\n4. **Medical Support:**\n   - Consult your doctor about medication options if lifestyle changes aren't enough\n   - Consider metformin if recommended\n   - Regular check-ups every 3-6 months\n\nRemember, every person's PCOS journey is unique. Work with your healthcare provider to create a personalized plan.",
  
  thyroid: "Thyroid health is crucial for overall wellness. Here's what you need to know:\n\n1. **Key Thyroid Markers:**\n   - TSH (Thyroid Stimulating Hormone): Normal range 0.5-5.0 mIU/L\n   - Free T4: Indicates thyroid hormone production\n   - Free T3: Active thyroid hormone\n\n2. **Symptoms to Watch For:**\n   - Unexplained weight changes\n   - Fatigue and low energy\n   - Mood changes or depression\n   - Hair loss or dry skin\n   - Temperature sensitivity\n\n3. **Healthy Thyroid Habits:**\n   - Ensure adequate iodine intake (salt, seafood, dairy)\n   - Get enough selenium (nuts, seeds, whole grains)\n   - Manage stress levels\n   - Exercise regularly\n   - Get 7-9 hours of sleep\n\n4. **Regular Testing:**\n   - If on thyroid medication, test every 6-12 months\n   - If symptoms present, ask your doctor for complete thyroid panel\n   - Women over 35 should get screened every 5 years\n\nAlways work with your healthcare provider for proper diagnosis and treatment.",
  
  exercise: "Regular exercise is essential for hormonal health and wellness:\n\n1. **Recommended Exercise Types:**\n   - **Cardio:** Walking, running, swimming, cycling (150 min/week moderate intensity)\n   - **Strength Training:** 2-3 sessions weekly to build muscle and improve insulin sensitivity\n   - **Flexibility:** Yoga or stretching to reduce stress and improve mobility\n   - **HIIT:** High intensity intervals (if you enjoy them) for metabolic benefits\n\n2. **Exercise Benefits for Women's Health:**\n   - Improves insulin sensitivity (helps with PCOS)\n   - Reduces inflammation\n   - Helps manage weight\n   - Improves mood and reduces anxiety\n   - Regulates hormonal cycles\n\n3. **Getting Started:**\n   - Start slowly and build gradually\n   - Find activities you enjoy\n   - Exercise at consistent times\n   - Combine different types of exercise\n   - Rest and recovery are important too\n\n4. **Important Notes:**\n   - Consult your doctor before starting new exercise program\n   - Listen to your body\n   - Don't exercise through pain\n   - Stay hydrated and fuel properly\n\nConsistency matters more than intensity. Start with what feels comfortable and gradually increase.",
  
  nutrition: "Nutrition plays a vital role in women's hormonal health:\n\n1. **Foods to Emphasize:**\n   - Lean proteins: Chicken, fish, legumes, tofu\n   - Whole grains: Oats, brown rice, quinoa\n   - Healthy fats: Olive oil, avocado, nuts, seeds\n   - Colorful vegetables: Leafy greens, broccoli, bell peppers\n   - Fruits: Berries, apples, citrus (in moderation)\n\n2. **Foods to Limit:**\n   - Refined carbohydrates and white bread\n   - Sugary drinks and processed foods\n   - Fried and heavily processed items\n   - Excessive caffeine\n   - Alcohol (especially for hormone balance)\n\n3. **Eating Patterns:**\n   - Eat regular meals to stabilize blood sugar\n   - Include protein with every meal\n   - Eat balanced portions\n   - Stay hydrated throughout the day\n   - Avoid skipping meals\n\n4. **For Specific Conditions:**\n   - PCOS: Low glycemic index diet, reduce processed foods\n   - Thyroid: Adequate iodine and selenium, avoid goitrogenic foods in excess\n   - General: Anti-inflammatory diet with omega-3s\n\nConsider consulting a registered dietitian for personalized nutrition guidance.",
  
  stress: "Stress management is essential for hormonal balance:\n\n1. **Stress Effects on Health:**\n   - Elevated cortisol disrupts hormonal balance\n   - Can worsen PCOS and thyroid symptoms\n   - Impacts sleep quality and weight\n   - Affects mood and mental health\n\n2. **Stress Management Techniques:**\n   - **Meditation:** Start with 5-10 minutes daily\n   - **Deep Breathing:** 4-7-8 technique or box breathing\n   - **Yoga:** Gentle or restorative practices\n   - **Progressive Relaxation:** Tense and release muscle groups\n   - **Journaling:** Write down thoughts and feelings\n\n3. **Lifestyle Approaches:**\n   - Regular exercise\n   - Adequate sleep (7-9 hours)\n   - Social connections and support\n   - Hobbies and activities you enjoy\n   - Time in nature\n   - Limit caffeine and alcohol\n\n4. **When to Seek Help:**\n   - If stress affects daily functioning\n   - Persistent anxiety or depression\n   - Inability to manage stress alone\n   - Consider speaking with a mental health professional\n\nRemember: Stress management is an ongoing practice. Be patient and kind with yourself.",
  
  symptoms: "Common women's health symptoms and when to seek care:\n\n1. **Hormonal Symptom Signs:**\n   - Irregular or heavy periods\n   - Severe cramping or pelvic pain\n   - Unexplained weight changes\n   - Mood swings or depression\n   - Skin issues or acne\n   - Hair loss or excessive hair growth\n\n2. **Thyroid Symptom Signs:**\n   - Fatigue despite adequate sleep\n   - Temperature sensitivity\n   - Unexplained mood changes\n   - Dry skin and hair loss\n   - Weight changes without diet changes\n\n3. **When to See a Doctor:**\n   - Symptoms persist for more than 2-3 months\n   - Symptoms significantly impact daily life\n   - You experience sudden changes\n   - Multiple symptoms together\n   - After lifestyle changes, symptoms don't improve\n\n4. **Emergency Signs (Seek Immediate Care):**\n   - Severe chest or abdominal pain\n   - Difficulty breathing\n   - Confusion or severe dizziness\n   - Signs of infection (high fever)\n\nTrust your body. If something feels wrong, it's worth getting checked out.",
};

function getFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check which health topic the user is asking about
  if (lowerMessage.includes('pcos') || lowerMessage.includes('pcod')) {
    return HEALTH_KNOWLEDGE_BASE.pcos;
  } else if (lowerMessage.includes('thyroid')) {
    return HEALTH_KNOWLEDGE_BASE.thyroid;
  } else if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('physical activity')) {
    return HEALTH_KNOWLEDGE_BASE.exercise;
  } else if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('eat')) {
    return HEALTH_KNOWLEDGE_BASE.nutrition;
  } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental health')) {
    return HEALTH_KNOWLEDGE_BASE.stress;
  } else if (lowerMessage.includes('symptom') || lowerMessage.includes('sign')) {
    return HEALTH_KNOWLEDGE_BASE.symptoms;
  }
  
  // Default helpful response
  return "I'm here to support your women's health journey! I can help you with:\n\n• **PCOS/PCOD** management and lifestyle tips\n• **Thyroid health** monitoring and care\n• **Exercise routines** for hormonal balance\n• **Nutrition** advice for wellness\n• **Stress management** techniques\n• **Symptom** understanding and tracking\n\nPlease ask me about any of these topics, and I'll provide detailed, evidence-based information to support your health goals. Always consult with your healthcare provider for personalized medical advice.";
}

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const ai = getAIClient();
    
    const systemPrompt = `You are HER metrix's compassionate and knowledgeable AI Health Assistant. You specialize in women's health, particularly:
- PCOS/PCOD management and lifestyle optimization
- Thyroid health and hormonal balance
- Symptom management and wellness strategies
- Nutrition, exercise, and stress management for women's health
- Medical report interpretation and health insights

Guidelines:
1. Be empathetic and supportive while maintaining medical accuracy
2. Provide evidence-based advice and recommendations
3. Encourage users to consult healthcare providers for serious concerns
4. Ask clarifying questions when needed to provide better guidance
5. Explain medical concepts in simple, non-technical language
6. Offer actionable, practical advice they can implement immediately
7. Remember context from previous messages in the conversation
8. Be encouraging and positive while being realistic

Important: Never diagnose conditions or replace professional medical advice. Always recommend consulting a healthcare provider for medical concerns.`;

    const contents = [
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: contents,
    });

    const aiResponse = response.text;
    if (!aiResponse) {
      throw new Error("Empty response from Gemini");
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Chat response generation error:', error);
    // Return intelligent fallback response based on user message
    return getFallbackResponse(userMessage);
  }
}
