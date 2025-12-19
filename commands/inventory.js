"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventory = inventory;
const items_1 = require("../data/items");
// 🚩 IMPORT THE NEW HELPER FUNCTION
const inventoryHelpers_1 = require("../utils/inventoryHelpers"); // Make sure the path is correct
function inventory(Message, userData) {
    const user = userData[Message.author.id];
    if (!user) {
        //@ts-ignore
        return Message.channel.send("You are not registered!");
    }
    let text = `🎒 **Your Gear & Inventory**\n\n`;
    // --- EQUIPMENT SECTION (No changes needed here) ---
    text += `🛡️ **Equipped**\n`;
    const slots = {
        head: "Head",
        body: "Body",
        legs: "Legs",
        boots: "Boots",
        rightarm: "Weapon",
        leftarm: "Offhand",
        accessory: "Accessory",
        skill: "Skill",
        spell: "Spell"
    };
    let hasEquipment = false;
    for (const slot in slots) {
        const id = user.equipment[slot];
        if (id) {
            const item = items_1.ITEMS[id];
            if (!item)
                continue;
            hasEquipment = true;
            //@ts-ignore
            text += `• **${slots[slot]}:** ${item.name}`;
            //@ts-ignore
            if (item.buff > 0 && item.buffType) {
                text += ` _(+${item.buff} ${item.buffType})_`;
            }
            text += `\n`;
        }
    }
    if (!hasEquipment) {
        text += `*(nothing equipped)*\n`;
    }
    text += `\n📦 **Inventory**\n`;
    // --- INVENTORY SECTION (MODIFIED) ---
    if (user.inventory.length === 0) {
        text += `*(empty)*`;
    }
    else {
        // 🚩 1. Group the raw inventory array into counts
        const groupedItems = (0, inventoryHelpers_1.groupInventory)(user.inventory);
        // 🚩 2. Iterate over the grouped items
        for (const itemId in groupedItems) {
            const count = groupedItems[itemId];
            const item = items_1.ITEMS[itemId];
            const itemName = item ? item.name : itemId;
            // 🚩 3. Format the output with the count
            //@ts-ignore
            if (count > 1) {
                text += `• ${itemName} **x${count}**\n`;
            }
            else {
                text += `• ${itemName}\n`;
            }
        }
    }
    //@ts-ignore
    Message.channel.send(text);
}
//# sourceMappingURL=inventory.js.map