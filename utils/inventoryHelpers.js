"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupInventory = groupInventory;
exports.giveItem = giveItem;
exports.removeItem = removeItem;
// utils/inventoryHelpers.ts
const items_1 = require("../data/items");
// 🚩 NEW FUNCTION: Group items and count quantities
function groupInventory(inventory) {
    const grouped = {};
    for (const itemId of inventory) {
        if (grouped[itemId]) {
            grouped[itemId]++;
        }
        else {
            grouped[itemId] = 1;
        }
    }
    return grouped;
}
function giveItem(user, itemId, qty = 1) {
    if (!items_1.ITEMS[itemId]) {
        console.warn(`Attempted to give unknown itemId: ${itemId}`);
        return;
    }
    if (!user.inventory)
        user.inventory = [];
    for (let i = 0; i < qty; i++) {
        user.inventory.push(itemId);
    }
}
function removeItem(user, itemId, qty = 1) {
    if (!user.inventory)
        return false;
    for (let i = 0; i < qty; i++) {
        const index = user.inventory.indexOf(itemId);
        if (index === -1) {
            // not enough items to remove
            return false;
        }
        user.inventory.splice(index, 1);
    }
    return true;
}
//# sourceMappingURL=inventoryHelpers.js.map