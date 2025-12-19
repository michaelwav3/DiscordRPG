"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.status = status;
function status(Message, userData) {
    //@ts-ignore
    const user = userData[Message.author.id];
    if (!user) {
        //@ts-ignore
        Message.channel.send("You are not registered! Use $register to register.");
        return;
    }
    //@ts-ignore
    Message.channel.send(`HP: **${user.HP}**\nMP: **${user.MP}**\nSP: **${user.SP}**`);
}
//# sourceMappingURL=status.js.map