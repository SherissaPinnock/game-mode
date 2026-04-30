import azaarPortrait from '@/assets/game-boy/portraits/azaar portrait.webp'
import edwardPortrait from '@/assets/game-boy/portraits/edward portrait.webp'
import ogrePortrait from '@/assets/game-boy/portraits/ogre.webp'
import raveenaPortrait from '@/assets/game-boy/portraits/raveena portrait.webp'
import zombiePortrait from '@/assets/game-boy/portraits/zombie portrait.webp'
import battleground1 from '@/assets/game-boy/setting/Battleground1.png'
import battleground2 from '@/assets/game-boy/setting/Battleground2.png'
import battleground3 from '@/assets/game-boy/setting/Battleground3.png'
import azaarSprite from '@/assets/game-boy/sprites/azaar sprite.png'
import edwardSprite from '@/assets/game-boy/sprites/edward sprite.png'
import ogreSprite from '@/assets/game-boy/sprites/ogre sprite.png'
import raveenaSprite from '@/assets/game-boy/sprites/raveena sprite.png'
import zombieSprite from '@/assets/game-boy/sprites/zombie sprite.png'
import cartridge1 from '@/assets/game-boy/cartridge 1.png'
import cartridge2 from '@/assets/game-boy/cartridge 2.png'
import cartridge3 from '@/assets/game-boy/cartridge 3.png'

export type HeroId = 'raveena' | 'azaar' | 'edward'
export type VillainId = 'ogre' | 'zombie'
export type SettingId = 'graveyard' | 'crystal-ruins' | 'ember-wastes'

export type GameBoyLoadout = {
  heroId: HeroId
  settingId: SettingId
}

export const HEROES = [
  {
    id: 'raveena',
    name: 'Raveena',
    portrait: raveenaPortrait,
    sprite: raveenaSprite,
    frames: 4,
    accent: '#ff8fc8',
    loadout: 'Arc shots',
    cartridgeImage: cartridge1,
  },
  {
    id: 'azaar',
    name: 'Azaar',
    portrait: azaarPortrait,
    sprite: azaarSprite,
    frames: 4,
    accent: '#79b8ff',
    loadout: 'Frost shots',
    cartridgeImage: cartridge2,
  },
  {
    id: 'edward',
    name: 'Edward',
    portrait: edwardPortrait,
    sprite: edwardSprite,
    frames: 5,
    accent: '#ffd36a',
    loadout: 'Heavy shots',
    cartridgeImage: cartridge3,
  },
] as const

export const VILLAINS = [
  {
    id: 'ogre',
    name: 'Ogre',
    portrait: ogrePortrait,
    sprite: ogreSprite,
    frames: 5,
    threat: 'Crusher',
  },
  {
    id: 'zombie',
    name: 'Zombie',
    portrait: zombiePortrait,
    sprite: zombieSprite,
    frames: 4,
    threat: 'Swarm',
  },
] as const

export const SETTINGS = [
  {
    id: 'graveyard',
    name: 'Graveyard',
    image: battleground1,
    tagline: 'Fog, stone, and old bones.',
  },
  {
    id: 'crystal-ruins',
    name: 'Crystal Ruins',
    image: battleground2,
    tagline: 'Bright ruins with sharp sight lines.',
  },
  {
    id: 'ember-wastes',
    name: 'Ember Wastes',
    image: battleground3,
    tagline: 'A hot zone made for chaos.',
  },
] as const

export const DEFAULT_LOADOUT: GameBoyLoadout = {
  heroId: HEROES[0].id,
  settingId: SETTINGS[0].id,
}

export function getHeroById(heroId: HeroId | null | undefined) {
  return HEROES.find((hero) => hero.id === heroId) ?? HEROES[0]
}

export function getSettingById(settingId: SettingId | null | undefined) {
  return SETTINGS.find((setting) => setting.id === settingId) ?? SETTINGS[0]
}
