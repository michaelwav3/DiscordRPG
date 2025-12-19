import { Message } from "discord.js";
import fs from "fs";
import { ITEMS } from "../data/items";

export function recalcStats(user: any) {
  // Start from base
  user.strength = user.baseStrength;
  user.agility = user.baseAgility;
  user.vitality = user.baseVitality;
  user.intelligence = user.baseIntelligence;
  user.perception = user.basePerception;

  // Apply equipment buffs
  for (const slot in user.equipment) {
    const itemId = user.equipment[slot];
    if (!itemId) continue;

    const item = ITEMS[itemId];
    if (!item?.buffType || !item?.buff) continue;

    user[item.buffType] += item.buff;
  }
}

function upgradeCost(statValue: number) {
  return Math.floor(10 * 10 ** ((statValue - 10) / 45));
}

export function upgrade(Message: Message, userData: any) {
  const args = Message.content.toLowerCase().split(" ");
  let stat = args[1] ?? "baseStrength";
  const requested = args[2];

  const user = userData[Message.author.id];
  if (!user) {
    //@ts-ignore
    Message.channel.send("You are not registered! Use %register to register.");
    return;
  }

  // ----- VALID STATS -----
  const validStats = ["baseStrength", "baseVitality", "baseAgility", "baseIntelligence", "basePerception"];
  if(stat === "strength" || stat === "str") stat = "baseStrength";
  if(stat === "vitality" || stat === "vit") stat = "baseVitality";
  if(stat === "agility" || stat === "agi") stat = "baseAgility";
  if(stat === "intelligence" || stat === "int") stat = "baseIntelligence";
  if(stat === "perception" || stat === "per") stat = "basePerception";
  if (!validStats.includes(stat)) {
       //@ts-ignore
    Message.channel.send(
      "Please specify a valid stat: strength, vitality, agility, intelligence, perception."
    );
    return;
  }

  // ----- COST CHECK -----
  if (requested === "cost") {
    const cost = upgradeCost(user[stat]);
       //@ts-ignore
       if(stat === "baseStrength") stat = "strength";
       if(stat === "baseVitality") stat = "vitality";
       if(stat === "baseAgility") stat = "agility";
       if(stat === "baseIntelligence") stat = "intelligence";
       if(stat === "basePerception") stat = "perception";
    //@ts-ignore
    Message.channel.send(
      `It will cost **${cost} coins** to upgrade **${stat}** by 1.`
    );
    return;
  }

  // ----- AMOUNT PARSING -----
  let amount = Number(requested);
  if (isNaN(amount) || amount <= 0) amount = 1;

  // ----- PRE-CHECK (simulate upgrades) -----
  let tempStat = user[stat];
  let tempBalance = user.balance;

  for (let i = 0; i < amount; i++) {
    const cost = upgradeCost(tempStat);
    if (tempBalance < cost) {
           //@ts-ignore
      Message.channel.send("You do not have enough coins!");
      return;
    }
    tempBalance -= cost;
    tempStat += 1;
  }

  // ----- APPLY UPGRADES -----
  for (let i = 0; i < amount; i++) {
    const cost = upgradeCost(user[stat]);
    user.balance -= cost;
    user[stat] += 1;
  }
   
   if(stat === "baseStrength") stat = "strength";
       if(stat === "baseVitality") stat = "vitality";
       if(stat === "baseAgility") stat = "agility";
       if(stat === "baseIntelligence") stat = "intelligence";
       if(stat === "basePerception") stat = "perception";
       //@ts-ignore
  Message.channel.send(
    `✅ Successfully upgraded **${stat}** by **${amount}** point(s)!`
  );

  recalcStats(user);

  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
}

