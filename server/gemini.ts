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

  diet_charts: "COMPREHENSIVE DIET CHARTS & MEAL PLANNING FOR WOMEN'S HEALTH\n\nPCOS-FRIENDLY DIET CHART:\n\nBREAKFAST (choose one):\n   - Spinach & egg omelet + whole wheat toast + avocado (350 cal)\n   - Greek yogurt + berries + almonds + honey (300 cal)\n   - Oatmeal with cinnamon + nuts + apple (280 cal)\n\nMID-MORNING SNACK:\n   - Almonds (23 pieces) + apple (150 cal)\n   - Celery + almond butter (180 cal)\n\nLUNCH (choose one):\n   - Grilled chicken (6 oz) + brown rice (1/2 cup) + vegetables (450 cal)\n   - Salmon fillet (5 oz) + sweet potato (1/2 cup) + broccoli (400 cal)\n   - Lentil soup (2 cups) + whole grain crackers + cucumber salad (380 cal)\n\nAFTERNOON SNACK:\n   - Greek yogurt (1 cup) + berries (150 cal)\n   - Hummus (1/4 cup) + carrot sticks (120 cal)\n\nDINNER (choose one):\n   - Turkey breast (6 oz) + quinoa (1/2 cup) + green beans (450 cal)\n   - Baked tofu (8 oz) + brown rice + stir-fried vegetables (420 cal)\n   - Fish (5 oz) + sweet potato + asparagus (380 cal)\n\nTOTAL: 1800-2000 calories | Macros: 40% protein, 35% carbs, 25% fats\n\nTHYROID-FRIENDLY DIET CHART:\n\nKEY NUTRIENTS:\n   - Iodine: Seaweed, fish, shellfish, dairy, eggs\n   - Selenium: Brazil nuts (2-3 daily), fish, eggs, whole grains\n   - Zinc: Oysters, beef, pumpkin seeds, chickpeas\n\nFOODS TO LIMIT (cook if eating):\n   - Raw cruciferous: cabbage, broccoli, kale - COOK THEM\n   - Soy products: tempeh, tofu - moderate intake\n   - Millet, cassava - occasional use\n\nSAMPLE DAY:\n   - Breakfast: Eggs + iodized salt + whole grain toast (320 cal)\n   - Lunch: Salmon + brown rice + cooked broccoli (450 cal)\n   - Snack: Brazil nuts + berries (180 cal)\n   - Dinner: Turkey + sweet potato + steamed spinach (400 cal)\n   - Snack: Greek yogurt + walnuts (150 cal)\n\nBALANCED WOMEN'S HEALTH DIET:\n\nDAILY STRUCTURE:\n   - 3 main meals + 2 snacks\n   - 5-6 servings vegetables/fruits\n   - Lean protein with each meal\n   - Whole grains for fiber\n   - Healthy fats daily\n\nPORTION SIZES:\n   - Protein: 4-6 oz per meal (palm-sized)\n   - Vegetables: 2+ cups per meal\n   - Whole grains: 1/2-1 cup cooked per meal\n   - Healthy fats: 1 tbsp oil or 1/4 avocado per meal\n   - Fruits: 1-2 servings daily\n\nMACRONUTRIENT BREAKDOWN:\n   - Protein: 25-30% of calories\n   - Carbohydrates: 45-50% of calories\n   - Fats: 20-25% of calories\n\nBEST FOODS BY CATEGORY:\n\nPROTEINS: Chicken, turkey, fish, eggs, Greek yogurt, tofu, legumes\nCARBS: Brown rice, quinoa, oats, sweet potatoes, whole wheat bread\nFATS: Olive oil, avocado, nuts, seeds, salmon\nVEGETABLES: Leafy greens, broccoli, peppers, carrots, zucchini\nFRUITS: Berries, apples, citrus (portion controlled)\n\nHYDRATION:\n   - Drink 2-3 liters water daily\n   - Herbal teas: chamomile, ginger\n   - Avoid: sugary drinks, excess caffeine\n\nSUCCESS TIPS:\n   1. Meal prep proteins & veggies on Sundays\n   2. Use your hand as portion guide\n   3. Eat at similar times daily\n   4. Combine protein + carbs + fiber at each meal\n   5. Read ingredient labels\n   6. Listen to your body's hunger cues\n\nWORK WITH A REGISTERED DIETITIAN FOR PERSONALIZED GUIDANCE!",
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
  } else if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('meal') || lowerMessage.includes('chart') || lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('breakfast') || lowerMessage.includes('lunch') || lowerMessage.includes('dinner')) {
    return HEALTH_KNOWLEDGE_BASE.diet_charts;
  } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental health')) {
    return HEALTH_KNOWLEDGE_BASE.stress;
  } else if (lowerMessage.includes('symptom') || lowerMessage.includes('sign')) {
    return HEALTH_KNOWLEDGE_BASE.symptoms;
  }
  
  // Default helpful response
  return "I'm here to support your women's health journey! I can help you with:\n\n• **PCOS/PCOD** management and lifestyle tips\n• **Thyroid health** monitoring and care\n• **Exercise routines** for hormonal balance\n• **Diet & Meal Charts** for various conditions\n• **Nutrition** advice for wellness\n• **Stress management** techniques\n• **Symptom** understanding and tracking\n\nPlease ask me about any of these topics, and I'll provide detailed, evidence-based information to support your health goals. Always consult with your healthcare provider for personalized medical advice.";
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
- Comprehensive diet planning and meal charts for various health conditions
- Nutrition, exercise, and stress management for women's health
- Medical report interpretation and health insights
- Personalized dietary recommendations based on health status

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
