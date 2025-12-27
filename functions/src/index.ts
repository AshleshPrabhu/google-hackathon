import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { upsertEmbedding } from "./vertex";
import { runSimilarityCheck } from "./matcher";
import { analyzeItemImage } from "./imageAI";

admin.initializeApp();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

async function generateSemanticDescription(
    name: string,
    rawDescription: string,
    category: string,
    location?: string
): Promise<string> {
    const prompt = `
    Convert the following lost/found item description into a concise semantic summary.

    Focus on:
    - color
    - material
    - size
    - brand (if any)
    - distinguishing features
    - likely usage context

    Item Name: ${name}
    Category: ${category}
    Location: ${location ?? "Unknown"}
    Raw Description: ${rawDescription}

    Return ONLY the summary text.
    `;

    const result = await textModel.generateContent(prompt);
    return result.response.text().trim();
}

async function generateEmbedding(text: string): Promise<number[]> {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

async function storeEmbedding(
    itemId: string,
    embedding: number[],
    type: "lost" | "found"
): Promise<string> {
    const vectorId = `${type}_${itemId}`;
    await upsertEmbedding(vectorId, embedding);
    return vectorId;
}

export const onLostItemCreate = onDocumentCreated(
    "lost_items/{itemId}",
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data();
        if (!data || data.embeddingId) return;

        let imageDescription = "";

        if (data.imageUrl) {
            imageDescription = await analyzeItemImage(data.imageUrl);
        }

        const combinedDescription = `
        User Description:
        ${data.rawDescription}

        Image Analysis:
        ${imageDescription}
        `;

        const semanticDescription = await generateSemanticDescription(
            data.name,
            combinedDescription,
            data.category,
            data.location 
        );

        const embeddingInput = `
    Item Type: Lost
    Name: ${data.name}
    Category: ${data.category}
    Description: ${semanticDescription}
    Location: ${data.location ?? "Unknown"}
    `;

        const embedding = await generateEmbedding(embeddingInput);

        const embeddingId = await storeEmbedding(
            event.params.itemId,
            embedding,
            "lost"
        );

        await snap.ref.update({
            semanticDescription,
            embeddingId,
        });

        await runSimilarityCheck(
            event.params.itemId,
            "lost",
            embedding
        );
    }
);

export const onFoundItemCreate = onDocumentCreated(
    "found_items/{itemId}",
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data();
        if (!data || data.embeddingId) return;

        let imageDescription = "";

        if (data.imageUrl) {
            imageDescription = await analyzeItemImage(data.imageUrl);
        }

        const combinedDescription = `
        User Description:
        ${data.rawDescription}

        Image Analysis:
        ${imageDescription}
        `;

        const semanticDescription = await generateSemanticDescription(
            data.name,
            combinedDescription,
            data.category,
            data.location
        );

        const embeddingInput = `
    Item Type: Found
    Name: ${data.name}
    Category: ${data.category}
    Description: ${semanticDescription}
    Location: ${data.location ?? "Unknown"}
    `;

        const embedding = await generateEmbedding(embeddingInput);

        const embeddingId = await storeEmbedding(
            event.params.itemId,
            embedding,
            "found"
        );

        await snap.ref.update({
            semanticDescription,
            embeddingId,
        });

        await runSimilarityCheck(
            event.params.itemId,
            "found",
            embedding
        );
    }
);

export { manualRecheck } from "./manualRecheck";
