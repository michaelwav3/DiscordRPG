"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalEconomy = calculateTotalEconomy;
//@ts-ignore
function calculateTotalEconomy(userData) {
    let total = 0;
    for (const id in userData) {
        const user = userData[id];
        total += (user.balance || 0) + (user.bank || 0);
    }
    return total;
}
//# sourceMappingURL=calculateTotalEconomy.js.map