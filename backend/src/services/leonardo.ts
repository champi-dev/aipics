interface LeonardoGenerationResponse {
  sdGenerationJob: {
    generationId: string;
  };
}

interface LeonardoGenerationResult {
  generations_by_pk: {
    id: string;
    status: "PENDING" | "COMPLETE" | "FAILED";
    generated_images: Array<{
      id: string;
      url: string;
    }>;
  };
}

export class LeonardoService {
  private apiKey: string;
  private baseUrl = "https://cloud.leonardo.ai/api/rest/v1";
  private modelId: string;

  constructor() {
    this.apiKey = process.env.LEONARDO_API_KEY!;
    this.modelId =
      process.env.LEONARDO_MODEL_ID || "ac614f96-1082-45bf-be9d-757f2d31c174"; // DreamShaper v7
  }

  async createGeneration(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        modelId: this.modelId,
        width: 512,
        height: 512,
        num_images: 1,
        guidance_scale: 7,
        public: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Leonardo API error: ${response.statusText}`);
    }

    const data = (await response.json()) as LeonardoGenerationResponse;
    return data.sdGenerationJob.generationId;
  }

  async getGenerationResult(generationId: string): Promise<{
    status: "PENDING" | "COMPLETE" | "FAILED";
    imageUrl?: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/generations/${generationId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Leonardo API error: ${response.statusText}`);
    }

    const data = (await response.json()) as LeonardoGenerationResult;
    const generation = data.generations_by_pk;

    return {
      status: generation.status,
      imageUrl: generation.generated_images?.[0]?.url,
    };
  }

  async pollForCompletion(
    generationId: string,
    maxAttempts = 30
  ): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getGenerationResult(generationId);

      if (result.status === "COMPLETE" && result.imageUrl) {
        return result.imageUrl;
      }

      if (result.status === "FAILED") {
        throw new Error("Image generation failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
    }

    throw new Error("Generation timed out");
  }
}
