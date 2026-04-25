import { getDb } from "../queries/connection";
import { activityLogs } from "@db/schema";

export async function logActivity(data: {
  type: "login" | "create" | "update" | "delete" | "auth" | "system";
  userId?: number;
  username?: string;
  action: string;
  details?: string;
}) {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      type: data.type,
      userId: data.userId,
      username: data.username,
      action: data.action,
      details: data.details,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
