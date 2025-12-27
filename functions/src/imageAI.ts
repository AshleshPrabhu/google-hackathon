import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

const visionModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

export async function analyzeItemImage(
    imageUrl: string
): Promise<string> {
    const imageBase64 = await fetchImageAsBase64(imageUrl);

    const prompt = `
    You are analyzing an image of a lost or found item.

    Describe the item focusing on:
    - object type
    - color
    - material
    - brand or logo (if visible)
    - distinctive features

    Return ONLY a concise description.
    `;

    const result = await visionModel.generateContent([
        { text: prompt },
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
            },
        },
    ]);

    return result.response.text().trim();
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString("base64");
}
