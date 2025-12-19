"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdraw = withdraw;
const fs_1 = __importDefault(require("fs"));
function withdraw(message, userData) {
    const user = userData[message.author.id];
    if (!user) {
        //@ts-ignore
        return message.channel.send("You're not registered!");
    }
    if (user.location !== "Western Capital Bank") {
        if (user.location == "Goblin Bank") {
            //@ts-ignore
            message.channel.send("The goblins won't allow you to withdraw anything...");
        }
        else {
            return;
        }
    }
    const arg = message.content.split(" ")[1];
    if (!arg) {
        //@ts-ignore
        return message.channel.send("Usage: `%withdraw <amount>` or `%withdraw all`");
    }
    let amount = 0;
    if (arg.toLowerCase() === "all") {
        amount = user.bank || 0;
    }
    else {
        amount = parseInt(arg);
        if (isNaN(amount) || amount <= 0) {
            //@ts-ignore
            return message.channel.send("Invalid withdrawal amount.");
        }
    }
    if (amount > (user.bank || 0)) {
        //@ts-ignore
        return message.channel.send("You don’t have that many coins in the bank.");
    }
    // Apply withdrawal
    user.bank = (user.bank || 0) - amount;
    user.balance += amount;
    fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    //@ts-ignore
    return message.channel.send(`🏧 Withdrew **${amount}** coins.\n` +
        `Bank Balance: **${user.bank}**\n` +
        `Wallet: **${user.balance}**`);
}
//# sourceMappingURL=withdraw.js.map