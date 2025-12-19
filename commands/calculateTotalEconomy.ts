//@ts-ignore
export function calculateTotalEconomy(userData) {
  let total = 0;

  for (const id in userData) {
    const user = userData[id];

    total += (user.balance || 0) + (user.bank || 0);
  }

  return total;
}
