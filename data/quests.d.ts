export type QuestStatus = "active" | "completed" | "rewarded";
export interface QuestDef {
    id: string;
    name: string;
    description: string;
    type: "kill" | "fetch";
    target?: string;
    required?: number;
    fetchItem?: string;
    fetchAmount?: number;
    turnInNpc?: string;
    rewardCoins: number;
    rewardItems?: string[];
}
export interface QuestState {
    id: string;
    status: QuestStatus;
    progress: number;
}
export declare const QUESTS: Record<string, QuestDef>;
//# sourceMappingURL=quests.d.ts.map