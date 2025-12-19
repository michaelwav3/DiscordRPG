"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stats = stats;
function stats(Message, userData) {
    //@ts-ignore
    const user = userData[Message.author.id];
    if (!user) {
        //@ts-ignore
        Message.channel.send("You are not registered! Use $register to register.");
        return;
    }
    let strDiff = "(+" + (user.strength - user.baseStrength).toString() + ")";
    if (strDiff == "(+0)")
        strDiff = "";
    let vitDiff = "(+" + (user.vitality - user.baseVitality).toString() + ")";
    if (vitDiff == "(+0)")
        vitDiff = "";
    let agiDiff = "(+" + (user.agility - user.baseAgility).toString() + ")";
    if (agiDiff == "(+0)")
        agiDiff = "";
    let intDiff = "(+" + (user.intelligence - user.baseIntelligence).toString() + ")";
    if (intDiff == "(+0)")
        intDiff = "";
    let perDiff = "(+" + (user.perception - user.basePerception).toString() + ")";
    if (perDiff == "(+0)")
        perDiff = "";
    let strMessage = `${user.baseStrength} ${strDiff}`;
    let vitMessage = `${user.baseVitality} ${vitDiff}`;
    let agiMessage = `${user.baseAgility} ${agiDiff}`;
    let intMessage = `${user.baseIntelligence} ${intDiff}`;
    let perMessage = `${user.basePerception} ${perDiff}`;
    //@ts-ignore
    Message.channel.send(`Strength: **${strMessage}**\nVitality: **${vitMessage}**\nAgility: **${agiMessage}**\nIntelligence: **${intMessage}**\nPerception: **${perMessage}**`);
}
//# sourceMappingURL=stats.js.map