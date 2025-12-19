import { activeCombats } from "./combatRegistry";
import { Message } from "discord.js";
import fs from "fs";

export async function joinCombat(message: Message, userData: any) {
  const user = userData[message.author.id];
  if (!user) return;

  if (user.inCombat) {
    return message.reply("You are already in combat.");
  }

  const combat = activeCombats.get(user.location);
  if (!combat) {
    return message.reply("No active combat here.");
  }

  const newPlayer = {
    id: message.author.id,
    name: message.author.username,
    maxHp: user.vitality * 10,
    hp: user.HP,
    maxSp: user.agility * 10,
    sp: user.SP,
    maxMp: user.intelligence * 10,
    mp: user.MP,
    str: user.strength,
    int: user.intelligence,
    speed: user.agility,
    statuses: [],
  };

  combat.addPlayer(newPlayer);

  user.inCombat = true;
  user.combatLocation = user.location;
//@ts-ignore
  message.channel.send(
    `⚔️ **${newPlayer.name}** joins the fight!`
  );
}
