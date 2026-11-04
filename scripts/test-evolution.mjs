// Prueba de la lógica de evolución. Uso: node scripts/test-evolution.mjs
import assert from 'node:assert/strict'
import { applyDay, applyReward, dayRatio, floorFor, healthTier, nextInfo, stageOf } from '../src/lib/evolutionCore.ts'

// Etapas por umbral
assert.equal(stageOf(0), 0)
assert.equal(stageOf(99), 0)
assert.equal(stageOf(100), 1)
assert.equal(stageOf(699), 2)
assert.equal(stageOf(700), 3)
assert.equal(stageOf(9999), 5)

// Recompensa: sube de etapa y recupera salud
let r = applyReward({ growth: 95, health: 50, maxStage: 0 }, 10)
assert.equal(r.stageUp, true)
assert.equal(r.state.maxStage, 1)
assert.equal(r.state.health, 53)
r = applyReward({ growth: 120, health: 99, maxStage: 1 }, 5)
assert.equal(r.stageUp, false)
assert.equal(r.state.health, 100)

// Día sin nada agendado = neutro
assert.equal(dayRatio(0, 0), null)
const base = { growth: 750, health: 80, maxStage: 3 }
assert.deepEqual(applyDay(base, 0, 0), base)

// Buen día recupera salud; día regular no cambia
assert.equal(applyDay(base, 8, 10).health, 90)
assert.deepEqual(applyDay(base, 5, 10), base)

// Mal día daña y resta crecimiento, nunca por debajo del piso (una etapa menos que la máxima)
let s = base
for (let i = 0; i < 60; i++) s = applyDay(s, 0, 5)
assert.equal(s.health, 0)
assert.equal(s.growth, floorFor(3)) // 300
assert.equal(stageOf(s.growth), 2) // máximo una etapa menos
assert.equal(s.maxStage, 3)

// Con maxStage 0 el piso es 0 y no hay negativos
s = { growth: 20, health: 100, maxStage: 0 }
for (let i = 0; i < 10; i++) s = applyDay(s, 0, 3)
assert.equal(s.growth, 0)

// Deterioro leve vs. grave
const light = applyDay({ growth: 500, health: 100, maxStage: 2 }, 1, 3) // 33 %
const worst = applyDay({ growth: 500, health: 100, maxStage: 2 }, 0, 3) // 0 %
assert.ok(light.health > worst.health)
assert.equal(worst.health, 75)

// Niveles de salud y progreso a la siguiente etapa
assert.equal(healthTier(80), 'ok')
assert.equal(healthTier(50), 'tired')
assert.equal(healthTier(30), 'damaged')
assert.equal(healthTier(5), 'critical')
assert.equal(nextInfo(200).missing, 100)
assert.equal(nextInfo(5000).next, null)

console.log('OK: lógica de evolución verificada')
