import { Message, EmbedBuilder } from "discord.js";
import { RECIPES } from "../data/recipes";
import { ITEMS } from "../data/items";

export function craft(message: Message, userData: any) {
  const user = userData[message.author.id];
  //@ts-ignore
  if (!user) return message.channel.send("You are not registered!");

  const args = message.content.split(" ");
  const recipeId = args[1];
  let amount = 1;

  if (!recipeId) {
    //@ts-ignore
    return message.channel.send("Usage: `%craft <recipeId> [amount]`");
  }

  if (args[2]) {
    const parsed = Number(args[2]);
    if (!isNaN(parsed) && parsed > 0) {
      amount = Math.floor(parsed);
    }
  }

  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) {
    //@ts-ignore
    return message.channel.send("That recipe does not exist.");
  }

  // 1. Ensure inventory is an array to prevent crashes
  if (!Array.isArray(user.inventory)) user.inventory = [];

  // 2. 🔒 Calculate max craftable amount using Array counting
  let maxCraftable = Infinity;

  for (const [itemId, needed] of Object.entries(recipe.inputs)) {
    // Count how many times this specific string appears in the array
    const owned = user.inventory.filter((i: string) => i === itemId).length;
    const possible = Math.floor(owned / needed);
    maxCraftable = Math.min(maxCraftable, possible);
  }

  if (maxCraftable <= 0) {
    //@ts-ignore
    return message.channel.send("You do not have enough materials to craft this.");
  }

  // Cap the amount based on what they can actually afford
  if (amount > maxCraftable) {
    amount = maxCraftable;
  }

  // 3. Remove materials from the Array
  for (const [itemId, needed] of Object.entries(recipe.inputs)) {
    const totalToRemove = needed * amount;
    let removedCount = 0;

    user.inventory = user.inventory.filter((i: string) => {
      if (i === itemId && removedCount < totalToRemove) {
        removedCount++;
        return false; // This removes the item from the new array
      }
      return true; // Keeps the item
    });
  }

  // 4. Add output items to the Array
  const { itemId, quantity } = recipe.output;
  const totalOutput = quantity * amount;
  
  for (let i = 0; i < totalOutput; i++) {
    user.inventory.push(itemId);
  }

  const embed = new EmbedBuilder()
    .setTitle("🛠️ Crafting Complete")
    .setDescription(
      //@ts-ignore
      `You crafted **${totalOutput}x ${ITEMS[itemId]?.name ?? itemId}**\n\n` +
      `**Times crafted:** ${amount}`
    )
    .setColor(0x57f287);

  //@ts-ignore
  message.channel.send({ embeds: [embed] });
}

export function craftList(message: Message) {
  const embed = new EmbedBuilder()
    .setTitle("📜 Crafting Recipes")
    .setDescription(
      RECIPES.map(recipe => {
        const requirements = Object.entries(recipe.inputs)
          .map(([itemId, qty]) => {
            const itemName = ITEMS[itemId]?.name ?? itemId;
            return `${qty}x ${itemName}`;
          })
          .join(", ");

        const outputName =
          ITEMS[recipe.output.itemId]?.name ?? recipe.output.itemId;

        return (
          `**${recipe.id}** — ${recipe.name}\n` +
          `➡️ **Crafts:** ${recipe.output.quantity}x ${outputName}\n` +
          `🧱 **Requires:** ${requirements}`
        );
      }).join("\n\n")
    )
    .setColor(0x57f287);

  //@ts-ignore
  message.channel.send({ embeds: [embed] });
}