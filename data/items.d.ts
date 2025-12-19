export type ItemType = "weapon" | "skill" | "spell" | "armor" | "consumable" | "misc";
export type EquipmentSlot = "head" | "body" | "legs" | "boots" | "accessory" | "rightarm" | "leftarm";
export type StatusType = "burn" | "poison" | "paralyze" | "freeze";
export type AbilityEffectType = "attack" | "buff" | "heal" | "utility";
export type StatType = "strength" | "agility" | "intelligence" | "vitality" | "perception";
export interface ItemStatusEffect {
    type: StatusType;
    duration: number;
    potency?: number;
    chance?: number;
}
export interface ItemDef {
    id: string;
    name: string;
    type: ItemType;
    slot?: EquipmentSlot;
    attack?: number;
    buff?: number;
    buffType?: string;
    consumable: boolean;
    description: string;
    abilityType?: AbilityEffectType | AbilityEffectType[];
    costSP?: number;
    costMP?: number;
    damageAmount?: number;
    healAmount?: number;
    status?: ItemStatusEffect;
}
export declare const ITEMS: Record<string, ItemDef>;
//# sourceMappingURL=items.d.ts.map