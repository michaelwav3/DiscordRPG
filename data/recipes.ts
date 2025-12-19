export interface CraftingRecipe {
  id: string;
  name: string;
  inputs: Record<string, number>; // itemId -> quantity
  output: {
    itemId: string;
    quantity: number;
  };
}

export const RECIPES: CraftingRecipe[] = [
  {
    id: "yeti_fur_cloak",
    name: "Yeti Fur Cloak",
    inputs: {
      yeti_fur: 3,
      yeti_pelt: 1,
    },
    output: {
      itemId: "yeti_fur_cloak",
      quantity: 1,
    },
  },
];
