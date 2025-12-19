// data/market.ts

export const SELL_MULTIPLIER = 0.5; // Shop buys back items for 50% of the base price

// Define base prices for buying (SHOP_INVENTORY) and selling (BASE_PRICES)
// Item ID: Base Price (in coins)
export const MARKET_PRICES: Record<string, number> = {
  wooden_stick: 5,
  bronze_sword: 250,
  iron_sword: 1000,
  bronze_helmet: 150,
  bronze_chestplate: 300,
  bronze_leggings: 250,
  bronze_boots: 200,
  iron_helmet: 400,
  iron_chestplate: 800,
  iron_leggings: 700,
  iron_boots: 600,
  blindfold: 10,
  stab: 25,
  // Items the market will buy but might not sell:
  spooky_bones: 800,
  darkmagic: 1000,
  yeti_fur_cloak: 5000,
  yeti_fur: 250,
  yeti_pelt: 500,
};

// Items the shop actively sells (uses MARKET_PRICES for the value)
export const SHOP_INVENTORY: Record<string, number> = {
    //@ts-ignore
  wooden_stick: MARKET_PRICES.wooden_stick,
  //@ts-ignore
  blindfold: MARKET_PRICES.blindfold,
  //@ts-ignore
  bronze_sword: MARKET_PRICES.bronze_sword,
  //@ts-ignore
  iron_sword: MARKET_PRICES.iron_sword,
  //@ts-ignore
  bronze_helmet: MARKET_PRICES.bronze_helmet,
  //@ts-ignore
  bronze_chestplate: MARKET_PRICES.bronze_chestplate,
  //@ts-ignore
  bronze_leggings: MARKET_PRICES.bronze_leggings,
  //@ts-ignore
  bronze_boots: MARKET_PRICES.bronze_boots,
  //@ts-ignore
  iron_helmet: MARKET_PRICES.iron_helmet,
  //@ts-ignore
  iron_chestplate: MARKET_PRICES.iron_chestplate,
  //@ts-ignore
  iron_leggings: MARKET_PRICES.iron_leggings,
  //@ts-ignore
  iron_boots: MARKET_PRICES.iron_boots, 
   //@ts-ignore
  stab: MARKET_PRICES.stab,
};