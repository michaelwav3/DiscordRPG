import { Message } from "discord.js";
import fs from "fs";
import { ITEMS } from "../data/items";
import { recalcStats } from "./upgrade";
const SLOT_MAP: any = {
  weapon: "rightarm",
  rightarm: "rightarm",
  offhand: "leftarm",
  leftarm: "leftarm",
  head: "head",
  body: "body",
  legs: "legs",
  boots: "boots",
  accessory: "accessory",
  skill: "skill",
  spell: "spell"
};

export function unequip(Message: Message, userData: any) {
  const user = userData[Message.author.id];
  if (!user) {
    //@ts-ignore
    return Message.channel.send("You are not registered! Use %register first.");
  }

  const input = Message.content.split(" ")[1]?.toLowerCase();
  if (!input) {
    //@ts-ignore
    return Message.channel.send("Specify a slot to unequip. Example: %unequip weapon");
  }

  const slot = SLOT_MAP[input];
  if (!slot) {
    //@ts-ignore
    return Message.channel.send("Invalid slot. Valid slots: weapon, offhand, head, body, legs, boots, accessory, skill, spell");
  }

  const equippedItemId = user.equipment[slot];
  if (!equippedItemId) {
    //@ts-ignore
    return Message.channel.send("That slot is already empty!");
  }

  const item = ITEMS[equippedItemId];
  if (!item) {
    user.equipment[slot] = null;
  } else {
    // Remove buff if item has any
    //@ts-ignore
    if (item.buff > 0 && item.buffType) {
      //@ts-ignore
      user[item.buffType] -= item.buff;
    }

    // Return item to inventory
    user.inventory.push(equippedItemId);
    user.equipment[slot] = null;
  }

  recalcStats(user);
  
  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));

  //@ts-ignore
  return Message.channel.send(`❌ Unequipped **${item.name}** from **${input}** slot!`);
}
