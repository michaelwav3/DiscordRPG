"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buy = buy;
const fs_1 = __importDefault(require("fs"));
const items_1 = require("../data/items");
const inventoryHelpers_1 = require("../utils/inventoryHelpers");
const market_1 = require("../data/market"); // 🚩 IMPORTED
function buy(Message, userData) {
    const user = userData[Message.author.id];
    if (!user) {
        //@ts-ignore
        return Message.channel.send("You are not registered!");
    }
    // 1. Check Location
    if (user.location !== "Western Capital Market") {
        //@ts-ignore
        return Message.channel.send("You can only use the **%buy** command at the **Western Capital Market**.");
    }
    const args = Message.content.slice(1).trim().split(/ +/);
    if (args.length < 2) {
        // We can now direct them to the %shop command instead of listing all items here:
        //@ts-ignore
        return Message.channel.send("Usage: `%buy [item name] [quantity]` (e.g., `%buy minor heal 2`). Use **%shop** to see prices.");
    }
    // ... (rest of the argument parsing logic remains the same) ...
    let itemNameParts = [];
    let quantityStr = '1';
    for (let i = 1; i < args.length; i++) {
        const part = args[i];
        //@ts-ignore
        if (!isNaN(parseInt(part))) {
            //@ts-ignore
            quantityStr = part;
            break;
        }
        //@ts-ignore
        itemNameParts.push(part);
    }
    const itemName = itemNameParts.join(' ').toLowerCase();
    const quantity = Math.max(1, parseInt(quantityStr));
    // 3. Find Item ID
    //@ts-ignore
    const itemId = Object.keys(items_1.ITEMS).find(key => items_1.ITEMS[key].name.toLowerCase() === itemName);
    if (!itemId) {
        //@ts-ignore
        return Message.channel.send(`❌ Item "**${itemName}**" not found in the shop!`);
    }
    const itemDef = items_1.ITEMS[itemId];
    // 4. Check if item is sellable by the shop
    const basePrice = market_1.SHOP_INVENTORY[itemId]; // 🚩 Uses imported constant
    if (!basePrice) {
        //@ts-ignore
        return Message.channel.send(`❌ The Western Capital Market does not sell **${itemDef.name}**.`);
    }
    // 5. Calculate Total Cost
    const totalCost = basePrice * quantity;
    // 6. Check Balance
    if (user.balance < totalCost) {
        //@ts-ignore
        return Message.channel.send(`💸 You need **${totalCost} coins** to buy ${quantity}x **${itemDef.name}**, but you only have **${user.balance}**.`);
    }
    // 7. Execute Purchase
    user.balance -= totalCost;
    (0, inventoryHelpers_1.giveItem)(user, itemId, quantity);
    fs_1.default.writeFileSync('userData.json', JSON.stringify(userData, null, 2));
    //@ts-ignore
    Message.channel.send(
    //@ts-ignore
    `✅ You bought ${quantity}x **${itemDef.name}** for **${totalCost} coins**! ` +
        `(Remaining balance: ${user.balance})`);
}
//# sourceMappingURL=buy.js.map