import type { ShopItem } from './types'

export const VEHICLES: ShopItem[] = [
  {
    id: 'vehicle-sedan-basic',
    name: 'Sedan Classic',
    description: 'Berline 4 portes fiable et économique',
    icon: '🚗',
    category: 'vehicle',
    shopCategory: 'vehicles',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    quantity: 1,
    weight: 0,
    value: 25000,
    usable: true,
    tradeable: true,
    inStock: true,
  },
]

export const CLOTHING: ShopItem[] = [
  {
    id: 'clothing-tshirt-basic',
    name: 'T-Shirt Basique',
    description: 'T-shirt confortable en coton',
    icon: '👕',
    category: 'clothing',
    shopCategory: 'clothing',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    quantity: 1,
    weight: 0.2,
    value: 25,
    usable: true,
    tradeable: true,
    inStock: true,
  },
]

export const FURNITURE: ShopItem[] = [
  {
    id: 'furniture-sofa-basic',
    name: 'Canapé 2 Places',
    description: 'Canapé confortable pour le salon',
    icon: '🛋️',
    category: 'furniture',
    shopCategory: 'furniture',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    quantity: 1,
    weight: 25,
    value: 500,
    usable: false,
    tradeable: true,
    inStock: true,
    previewModel: 'ModernSofa',
  },
]

export const ELECTRONICS: ShopItem[] = [
  {
    id: 'electronics-phone-basic',
    name: 'Smartphone Basique',
    description: 'Téléphone fonctionnel pour appels et SMS',
    icon: '📱',
    category: 'electronics',
    shopCategory: 'electronics',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    quantity: 1,
    weight: 0.2,
    value: 300,
    usable: true,
    tradeable: true,
    inStock: true,
  },
]

export const SHOP_ITEMS: ShopItem[] = [
  ...VEHICLES,
  ...CLOTHING,
  ...FURNITURE,
  ...ELECTRONICS,
]

export function getShopItemsByCategory(category: ShopItem['shopCategory']) {
  return SHOP_ITEMS.filter((item) => item.shopCategory === category && item.inStock)
}