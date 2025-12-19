"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quests = quests;
const questHelpers_1 = require("../utils/questHelpers");
function quests(message, userData) {
    const user = userData[message.author.id];
    if (!user) {
        //@ts-ignore
        message.channel.send("You are not registered! Use %register to register.");
        return;
    }
    const lines = (0, questHelpers_1.getQuestDisplayLines)(user);
    //@ts-ignore
    message.channel.send("Quests:\n" + lines.join("\n"));
}
//# sourceMappingURL=quests.js.map