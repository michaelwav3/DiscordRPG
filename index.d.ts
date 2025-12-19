import type { QuestState } from "./data/quests";
export declare class User {
    UID: string;
    balance: number;
    HP: number;
    MP: number;
    SP: number;
    baseStrength: number;
    baseAgility: number;
    baseIntelligence: number;
    baseVitality: number;
    basePerception: number;
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
    perception: number;
    location: string;
    bank: number;
    inCombat: boolean;
    inventory: never[];
    equipment: {
        body: null;
        head: null;
        legs: null;
        boots: null;
        rightarm: null;
        leftarm: null;
        accessory: null;
        skill: null;
        spell: null;
    };
    quests: QuestState[];
    interactables: string[];
    element: "fire" | "water" | "earth" | "air" | null;
    elementTier: number;
    elementsUnlocked: string[];
    waitingForElementChoice?: boolean;
    constructor(UID: string);
}
//# sourceMappingURL=index.d.ts.map