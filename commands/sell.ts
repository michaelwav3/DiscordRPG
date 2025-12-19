// commands/sell.ts
import { Message } from "discord.js";
import fs from 'fs';
import { ITEMS } from "../data/items";
import { removeItem, groupInventory } from "../utils/inventoryHelpers";
// 🚩 IMPORTED
import { MARKET_PRICES, SELL_MULTIPLIER } from "../data/market"; 

// Using MARKET_PRICES instead of BASE_PRICES
const BASE_PRICES = MARKET_PRICES;


export function sell(Message: Message, userData: any) {
  const user = userData[Message.author.id];
  if (!user) {
    //@ts-ignore
    return Message.channel.send("You are not registered!");
  }

  // 1. Check Location
  if (user.location !== "Western Capital Market") {
    //@ts-ignore
    return Message.channel.send("You can only use the **%sell** command at the **Western Capital Market**.");
  }

  const args = Message.content.slice(1).trim().split(/ +/);

  if (args.length < 2) {
    const groupedInv = groupInventory(user.inventory);
    let list = "💰 **Your Sellable Inventory**:\n";
    let hasSellable = false;

    for (const id in groupedInv) {
      const basePrice = BASE_PRICES[id];
      if (basePrice) {
        hasSellable = true;
        const sellPrice = Math.floor(basePrice * SELL_MULTIPLIER); // 🚩 Uses imported multiplier
        const item = ITEMS[id];
        //@ts-ignore
        list += `• ${item.name} x${groupedInv[id]} (Sell: **${sellPrice}** coins each)\n`;
      }
    }

    if (!hasSellable) {
      list += "(You have no items the market will buy.)\n";
    }

    list += "\nUsage: `%sell [item name] [quantity]` (e.g., `%sell wooden stick 1`). Use **%shop** to see prices.";
    //@ts-ignore
    return Message.channel.send(list);
  }
  
  // ... (rest of the argument parsing logic remains the same) ...
  let itemNameParts: string[] = [];
  let quantityStr = '1';
  // ... (parsing logic) ...
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
  const itemId = Object.keys(ITEMS).find(key => ITEMS[key].name.toLowerCase() === itemName);
  // ... (error checks) ...
  if (!itemId) {
    //@ts-ignore
    return Message.channel.send(`❌ Item "**${itemName}**" not recognized.`);
  }
  
  const itemDef = ITEMS[itemId];

  // 4. Check if item is sellable and get price
  const basePrice = BASE_PRICES[itemId];
  if (!basePrice) {
    //@ts-ignore
    return Message.channel.send(`❌ The market will not buy **${itemDef.name}**.`);
  }
  
  // 5. Check Inventory Count
  const currentCount = groupInventory(user.inventory)[itemId] || 0;
  if (currentCount < quantity) {
    //@ts-ignore
    return Message.channel.send(`❌ You only have **${currentCount}**x **${itemDef.name}**.`);
  }

  // 6. Calculate Total Revenue
  const sellPricePerUnit = Math.floor(basePrice * SELL_MULTIPLIER); // 🚩 Uses imported multiplier
  const totalRevenue = sellPricePerUnit * quantity;

  // 7. Execute Sale
  const success = removeItem(user, itemId, quantity);

  if (success) {
      user.balance += totalRevenue;
      fs.writeFileSync('userData.json', JSON.stringify(userData, null, 2));

      //@ts-ignore
      Message.channel.send(
             //@ts-ignore
          `✅ You sold ${quantity}x **${itemDef.name}** for **${totalRevenue} coins**! ` +
          `(New balance: ${user.balance})`
      );
  } else {
      //@ts-ignore
      Message.channel.send("An error occurred during the sale process.");
  }
}