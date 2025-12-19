import { QuestState, QuestStatus } from "../data/quests";
export declare function getQuestState(user: any, questId: string): QuestState | undefined;
export declare function startQuest(user: any, questId: string): QuestState | null;
export declare function setQuestStatus(user: any, questId: string, status: QuestStatus): void;
export declare function incrementKillQuests(user: any, enemyTag: string): void;
export declare function checkFetchQuestCompletion(user: any, npcId: string): string | null;
export declare function getQuestDisplayLines(user: any): string[];
//# sourceMappingURL=questHelpers.d.ts.map