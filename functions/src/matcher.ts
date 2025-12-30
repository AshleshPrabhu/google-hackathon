import * as admin from "firebase-admin";
import { findSimilarItems } from "./vertex";

const db = admin.firestore();

const SIMILARITY_THRESHOLD = 0.75;

async function writeMatchToItem(
    itemType: "lost" | "found",
    itemId: string,
    match: any
) {
    const ref = db.collection(`${itemType}_items`).doc(itemId);
    const snap = await ref.get();
    if (!snap.exists) return;

    const existingMatches = snap.data()?.matches || [];

    if (existingMatches.some((m: any) => m.itemId === match.itemId)) {
        return;
    }

    await ref.update({
        matches: [...existingMatches, match],
    });
}

export async function runSimilarityCheck(
    itemId: string,
    itemType: "lost" | "found",
    embedding: number[]
) {
    const searchFor = itemType === "lost" ? "found" : "lost";

    const aiMatches = await findSimilarItems(embedding, searchFor);
    const filtered = aiMatches.filter(m => m.score >= SIMILARITY_THRESHOLD);

    if (filtered.length === 0) return [];

    const sourceRef = db.collection(`${itemType}_items`).doc(itemId);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) return [];

    const sourceUserId = sourceSnap.data()?.userId;
    if (!sourceUserId) return [];

    for (const m of filtered) {
        const targetRef = db.collection(`${searchFor}_items`).doc(m.id);
        const targetSnap = await targetRef.get();
        if (!targetSnap.exists) continue;

        const targetUserId = targetSnap.data()?.userId;
        if (!targetUserId) continue;

        const sourceMatch = {
            itemId: m.id,
            userId: targetUserId,
            score: m.score,
            type: searchFor,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const targetMatch = {
            itemId,
            userId: sourceUserId,
            score: m.score,
            type: itemType,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await writeMatchToItem(itemType, itemId, sourceMatch);
        await writeMatchToItem(searchFor, m.id, targetMatch);
    }

    return filtered;
}
