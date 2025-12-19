"use strict";
// src/data/quests.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUESTS = void 0;
// MASTER QUEST LIST
exports.QUESTS = {
    tutorial_bandits: {
        id: "tutorial_bandits",
        name: "Tutorial: Bandit Problem",
        description: "Help Henry by defeating 5 bandits outside his basement.",
        type: "kill",
        target: "bandit",
        required: 5,
        rewardCoins: 10,
        rewardItems: ["wooden_stick"], // optional, hook into your item system later
    },
    goblins: {
        id: "goblins",
        name: "Guckus 1: Goblins",
        description: "Help Guckus by defeating goblins.",
        type: "kill",
        target: "goblin",
        required: 5,
        rewardCoins: 15,
        rewardItems: []
    },
    goblinShaman: {
        id: "goblinShaman",
        name: "Guckus 2: Goblin Shaman",
        description: "Help Guckus by defeating a goblin shaman.",
        type: "kill",
        target: "goblin shaman",
        required: 1,
        rewardCoins: 100,
        rewardItems: ["western_badge"]
    },
    otzi_quest: {
        id: "otzi_quest",
        name: "Otzi's Request",
        description: "Bring 1 Yeti Fur Cloak to Otzi.",
        type: "fetch",
        fetchItem: "yeti_fur_cloak",
        fetchAmount: 1,
        turnInNpc: "otzi",
        rewardCoins: 0,
        rewardItems: ["frostspire_staff"]
    }
};
//# sourceMappingURL=quests.js.map