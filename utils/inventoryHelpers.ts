// utils/inventoryHelpers.ts
import { ITEMS } from "../data/items";

// 🚩 NEW FUNCTION: Group items and count quantities
export function groupInventory(inventory: string[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  for (const itemId of inventory) {
    if (grouped[itemId]) {
      grouped[itemId]++;
    } else {
      grouped[itemId] = 1;
    }
  }
  return grouped;
}

export function giveItem(user: any, itemId: string, qty: number = 1) {
  if (!ITEMS[itemId]) {
    console.warn(`Attempted to give unknown itemId: ${itemId}`);
    return;
  }
  if (!user.inventory) user.inventory = [];
  for (let i = 0; i < qty; i++) {
    user.inventory.push(itemId);
  }
}

export function removeItem(user: any, itemId: string, qty: number = 1): boolean {
  if (!user.inventory) return false;

  for (let i = 0; i < qty; i++) {
    const index = user.inventory.indexOf(itemId);
    if (index === -1) {
      // not enough items to remove
      return false;
    }
    user.inventory.splice(index, 1);
  }
  return true;
}