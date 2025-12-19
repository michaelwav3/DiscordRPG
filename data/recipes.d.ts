export interface CraftingRecipe {
    id: string;
    name: string;
    inputs: Record<string, number>;
    output: {
        itemId: string;
        quantity: number;
    };
}
export declare const RECIPES: CraftingRecipe[];
//# sourceMappingURL=recipes.d.ts.map