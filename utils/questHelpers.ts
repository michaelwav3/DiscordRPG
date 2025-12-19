// src/utils/questHelpers.ts
import { QUESTS, QuestDef, QuestState, QuestStatus } from "../data/quests";

function findQuestDef(id: string): QuestDef | undefined {
  return QUESTS[id];
}

export function getQuestState(user: any, questId: string): QuestState | undefined {
  if (!user.quests) user.quests = [];
  return user.quests.find((q: QuestState) => q.id === questId);
}

export function startQuest(user: any, questId: string): QuestState | null {
  const def = findQuestDef(questId);
  if (!def) return null;

  if (!user.quests) user.quests = [];

  let existing = getQuestState(user, questId);
  if (existing) return existing; // already have it

  const newQuest: QuestState = {
    id: questId,
    status: "active",
    progress: 0,
  };

  user.quests.push(newQuest);
  return newQuest;
}

export function setQuestStatus(user: any, questId: string, status: QuestStatus) {
  const qs = getQuestState(user, questId);
  if (!qs) return;
  qs.status = status;
}

export function incrementKillQuests(user: any, enemyTag: string) {
  if (!user.quests) return;

  for (const qs of user.quests as QuestState[]) {
    const def = findQuestDef(qs.id);
    if (!def) continue;

    if (def.type === "kill" && def.target === enemyTag && qs.status === "active") {
      qs.progress += 1;
      //@ts-ignore
      if (qs.progress >= def.required) {
        qs.status = "completed";
      }
    }
  }
}

export function checkFetchQuestCompletion(
  user: any,
  npcId: string
): string | null {
  if (!user.quests) return null;

  for (const q of user.quests) {
    if (q.status !== "active") continue;

    const def = QUESTS[q.id];
    if (!def || def.type !== "fetch") continue;
    if (def.turnInNpc !== npcId) continue;

    const have = user.inventory[def.fetchItem!] || 0;
    const need = def.fetchAmount ?? 1;

    if (have < need) {
      return `❌ You still need **${need - have}x ${def.fetchItem}**.`;
    }

    // Consume items
    user.inventory[def.fetchItem!] -= need;

    // Mark quest complete
    q.status = "completed";

    return `✅ You delivered the items for **${def.name}**!`;
  }

  return null;
}


export function getQuestDisplayLines(user: any): string[] {
  if (!user.quests || user.quests.length === 0) return ["(no active quests)"];

  const lines: string[] = [];

  for (const qs of user.quests as QuestState[]) {
    const def = findQuestDef(qs.id);
    if (!def) {
      lines.push(`• Unknown quest (${qs.id}) – status: ${qs.status}`);
      continue;
    }

    // 1. Determine the goal number (Required kills vs Fetch amount)
    const goal = def.required || def.fetchAmount || 0;

    // 2. Determine current progress
    // For fetch quests, progress is usually based on current inventory
    let currentProgress = qs.progress;

if (def.type === "fetch") {
  if (qs.status === "completed" || qs.status === "rewarded") {
    // Fetch quest is done → show full progress
    currentProgress = goal;
  } else {
    // Active fetch quest → show inventory-based progress
    const itemId = def.fetchItem;
    currentProgress =
      user.inventory?.filter((i: string) => i === itemId).length || 0;

    if (currentProgress > goal) currentProgress = goal;
  }
}


    let statusText = "";
    if (qs.status === "active") statusText = "Active";
    else if (qs.status === "completed") statusText = "Completed (return to quest giver)";
    else if (qs.status === "rewarded") statusText = "Done";

    lines.push(
      `• ${def.name} – ${statusText} ` +
      `(Progress: ${currentProgress}/${goal})`
    );
  }

  return lines;
}
