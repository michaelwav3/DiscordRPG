import { Message } from "discord.js";
export interface EnemyDrop {
    itemId: string;
    chance: number;
    min?: number;
    max?: number;
}
export interface EnemyConfig {
    name: string;
    maxHp: number;
    str: number;
    speed: number;
    fleeResist: number;
    coinReward: number;
    int?: number;
    maxSp?: number;
    maxMp?: number;
    skillIds?: string[];
    spellIds?: string[];
    skillChance?: number;
    spellChance?: number;
    drops?: EnemyDrop[];
}
export declare function startCombat(message: Message, userData: any, enemyConfig: EnemyConfig): Promise<void>;
//# sourceMappingURL=combat.d.ts.map