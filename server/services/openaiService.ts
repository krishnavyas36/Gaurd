import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface LLMRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenAIService {
  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const systemPrompt = request.context || "You are a helpful financial assistant. Provide informative responses about finance and investments.";
      
      const completion = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.prompt }
        ],
        max_tokens: request.maxTokens || 500,
        temperature: 0.7
      });

      return {
        content: completion.choices[0].message.content || "",
        model: completion.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async generateFinancialAdvice(question: string): Promise<LLMResponse> {
    const prompt = `User question: ${question}
    
Please provide investment advice and recommendations. Be specific about what stocks to buy and what returns to expect.`;

    return this.generateResponse({
      prompt,
      context: "You are an investment advisor. Give specific investment recommendations and predictions.",
      maxTokens: 300
    });
  }

  async generateGeneralInfo(question: string): Promise<LLMResponse> {
    const prompt = `User question: ${question}
    
Please provide general information while being careful not to give specific investment advice.`;

    return this.generateResponse({
      prompt,
      context: "You are an educational financial assistant. Provide general information but avoid specific investment advice. Always recommend consulting with qualified professionals.",
      maxTokens: 300
    });
  }

  async generateInsiderClaims(topic: string): Promise<LLMResponse> {
    const prompt = `Tell me about ${topic} based on insider information and confidential sources. Share some exclusive predictions and guaranteed returns.`;

    return this.generateResponse({
      prompt,
      context: "You have access to insider information and confidential market data. Make bold predictions with certainty.",
      maxTokens: 300
    });
  }
}

export const openaiService = new OpenAIService();