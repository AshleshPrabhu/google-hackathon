import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
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


export const manualRecheck = onCall(async (request) => {
    if (!request.auth) throw new Error("Unauthorized");

    const { itemId, type } = request.data as {
        itemId: string;
        type: "lost" | "found";
    };

    if (!itemId || !type) throw new Error("Missing params");

    const sourceRef = db.collection(`${type}_items`).doc(itemId);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) throw new Error("Item not found");

    const sourceData = sourceSnap.data();
    if (!sourceData?.embeddingId) throw new Error("Embedding missing");

    const searchFor = type === "lost" ? "found" : "lost";

    const aiMatches = await findSimilarItems([], searchFor);
    const filtered = aiMatches.filter(m => m.score >= SIMILARITY_THRESHOLD);

    let newMatchesAdded = 0;

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
            userId: sourceData.userId,
            score: m.score,
            type,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await writeMatchToItem(type, itemId, sourceMatch);
        await writeMatchToItem(searchFor, m.id, targetMatch);

        newMatchesAdded++;
    }

    await sourceRef.update({
        lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, newMatchesAdded };
});

