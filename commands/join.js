"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinCombat = joinCombat;
const combatRegistry_1 = require("./combatRegistry");
async function joinCombat(message, userData) {
    const user = userData[message.author.id];
    if (!user)
        return;
    if (user.inCombat) {
        return message.reply("You are already in combat.");
    }
    const combat = combatRegistry_1.activeCombats.get(user.location);
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
    message.channel.send(`⚔️ **${newPlayer.name}** joins the fight!`);
}
//# sourceMappingURL=join.js.map