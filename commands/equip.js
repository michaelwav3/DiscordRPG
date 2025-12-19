"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.equip = equip;
const fs_1 = __importDefault(require("fs"));
const items_1 = require("../data/items");
const upgrade_1 = require("./upgrade");
function equip(Message, userData) {
    const user = userData[Message.author.id];
    if (!user) {
        //@ts-ignore
        return Message.channel.send("You are not registered! Use %register first.");
    }
    // Get the item name as provided by the user, split and join
    const input = Message.content.split(" ").slice(1).join(" "); // DO NOT convert to lowercase yet
    if (!input) {
        //@ts-ignore
        return Message.channel.send("Specify an item to equip. Example: %equip wooden_stick");
    }
    // ===========================================
    // 🚩 FIX: Find the correct, case-sensitive item ID
    // ===========================================
    const itemMatch = Object.values(items_1.ITEMS).find((item) => item.name.toLowerCase() === input.toLowerCase());
    if (!itemMatch) {
        //@ts-ignore
        return Message.channel.send("That item does not exist in the database.");
    }
    const itemId = itemMatch.id; // Use the case-sensitive ID (e.g., "jetStream")
    // Check if the item is in the user's inventory using the correct ID
    const itemIndexInInventory = user.inventory.indexOf(itemId);
    if (itemIndexInInventory === -1) {
        //@ts-ignore
        return Message.channel.send("You don't have that item in your inventory.");
    }
    const item = itemMatch; // Use the found item object
    // The rest of the logic remains the same, using the itemIndexInInventory
    // to splice and the correct itemId to assign to equipment.
    // ===========================================
    // WEAPON EQUIP LOGIC (Updated to use itemIndexInInventory)
    // ===========================================
    if (item.type === "weapon") {
        const oldWeapon = user.equipment.rightarm;
        // Remove previous buff
        if (oldWeapon) {
            const old = items_1.ITEMS[oldWeapon];
            //@ts-ignore
            if (old.buffType && old.buff > 0) {
                //@ts-ignore
                user[old.buffType] -= old.buff;
            }
            user.inventory.push(oldWeapon);
        }
        // Remove new weapon from inventory
        user.inventory.splice(itemIndexInInventory, 1);
        // Equip new weapon
        user.equipment.rightarm = itemId;
        // Apply new buff
        //@ts-ignore
        if (item.buffType && item.buff > 0) {
            //@ts-ignore
            user[item.buffType] += item.buff;
        }
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
        //@ts-ignore
        return Message.channel.send(`🗡️ Equipped **${item.name}** as your weapon!`);
    }
    // ===========================================
    // SKILL SCROLL EQUIP LOGIC (Updated to use itemIndexInInventory)
    // ===========================================
    if (item.type === "skill") {
        // Unequip old scroll if exists and move it to inventory
        if (user.equipment.skill) {
            user.inventory.push(user.equipment.skill);
        }
        // Remove new scroll from inventory and equip
        user.inventory.splice(itemIndexInInventory, 1);
        user.equipment.skill = itemId;
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
        //@ts-ignore
        return Message.channel.send(`📜 Equipped skill scroll: **${item.name}**`);
    }
    // ===========================================
    // SPELL SCROLL EQUIP LOGIC (Updated to use itemIndexInInventory)
    // ===========================================
    if (item.type === "spell") {
        // Unequip old spell if exists and move it to inventory
        if (user.equipment.spell) {
            user.inventory.push(user.equipment.spell);
        }
        // Remove new spell from inventory and equip
        user.inventory.splice(itemIndexInInventory, 1);
        user.equipment.spell = itemId;
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
        //@ts-ignore
        return Message.channel.send(`✨ Equipped spell scroll: **${item.name}**`);
    }
    //@ts-ignore
    // ===========================================
    // ARMOR EQUIP LOGIC
    // ===========================================
    if (item.type === "armor") {
        const slot = item.slot;
        if (!slot || !(slot in user.equipment)) {
            //@ts-ignore
            return Message.channel.send("This armor cannot be equipped (invalid slot).");
        }
        const oldArmorId = user.equipment[slot];
        // Unequip old armor
        if (oldArmorId) {
            const old = items_1.ITEMS[oldArmorId];
            if (old?.buffType && old?.buff) {
                user[old.buffType] -= old.buff;
            }
            user.inventory.push(oldArmorId);
        }
        // Remove new armor from inventory
        user.inventory.splice(itemIndexInInventory, 1);
        // Equip new armor
        user.equipment[slot] = itemId;
        // Apply new buff
        if (item.buffType && item.buff) {
            user[item.buffType] += item.buff;
        }
        (0, upgrade_1.recalcStats)(user);
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
        //@ts-ignore
        return Message.channel.send(`🛡️ Equipped **${item.name}** to **${slot}** slot!`);
    }
    // Fallback
    //@ts-ignore
    return Message.channel.send("You can't equip that item type yet!");
}
//# sourceMappingURL=equip.js.map