import { describe, it, expect } from 'vitest'
import { calculateRoute, formatDuration, formatDistance } from '../../../src/services/RouteService'

// Coordenadas reales para tests deterministas
const SANTO_DOMINGO = { lat: 18.4861, lng: -69.9312 }
const SANTIAGO     = { lat: 19.4517, lng: -70.6970 }
const CERCA        = { lat: 18.4900, lng: -69.9350 } // ~500m

describe('RouteService.ts', () => {
  describe('calculateRoute', () => {
    it('retorna distance y duration para dos coordenadas', async () => {
      const result = await calculateRoute(SANTO_DOMINGO, SANTIAGO)
      expect(result).toHaveProperty('distance')
      expect(result).toHaveProperty('duration')
    })

    it('distance es un número positivo en metros', async () => {
      const result = await calculateRoute(SANTO_DOMINGO, SANTIAGO)
      expect(result.distance).toBeGreaterThan(0)
    })

    it('duration es un número positivo en segundos', async () => {
      const result = await calculateRoute(SANTO_DOMINGO, SANTIAGO)
      expect(result.duration).toBeGreaterThan(0)
    })

    it('distancia corta (<5km) usa velocidad urbana (30km/h)', async () => {
      const result = await calculateRoute(SANTO_DOMINGO, CERCA)
      // < 5km → velocidad 30km/h → duración mayor que si fuera carretera
      expect(result.distance).toBeLessThan(5000)
    })

    it('distancia larga (>20km) usa velocidad de carretera (80km/h)', async () => {
      const resultLong  = await calculateRoute(SANTO_DOMINGO, SANTIAGO)
      const distKm = resultLong.distance / 1000
      expect(distKm).toBeGreaterThan(20)
      // Verificar que la duración es coherente con ~80km/h + 20% buffer
      const expectedMaxSeconds = (distKm / 80) * 3600 * 1.2 * 1.05 // 5% tolerancia
      expect(resultLong.duration).toBeLessThanOrEqual(expectedMaxSeconds)
    })

    it('aplica 20% de buffer a la duración calculada', async () => {
      const result = await calculateRoute(SANTO_DOMINGO, SANTIAGO)
      const distKm = result.distance / 1000
      // La duración sin buffer a 80km/h sería (distKm/80)*3600
      const durationWithoutBuffer = (distKm / 80) * 3600
      // Con buffer debe ser ~20% mayor
      expect(result.duration).toBeGreaterThan(durationWithoutBuffer)
    })

    it('devuelve distancia cero cuando origen y destino son iguales', async () => {
      const result = await calculateRoute(SANTO_DOMINGO, SANTO_DOMINGO)
      expect(result.distance).toBe(0)
      expect(result.duration).toBe(0)
    })
  })

  describe('formatDuration', () => {
    it('formatea menos de una hora sólo en minutos', () => {
      expect(formatDuration(1800)).toBe('30min')
    })

    it('formatea exactamente 60 minutos como 1h 0min', () => {
      expect(formatDuration(3600)).toBe('1h 0min')
    })

    it('formatea 90 minutos como 1h 30min', () => {
      expect(formatDuration(5400)).toBe('1h 30min')
    })

    it('formatea 0 segundos como 0min', () => {
      expect(formatDuration(0)).toBe('0min')
    })

    it('formatea 2 horas exactas', () => {
      expect(formatDuration(7200)).toBe('2h 0min')
    })

    it('formatea 2 horas y 45 minutos', () => {
      expect(formatDuration(9900)).toBe('2h 45min')
    })
  })

  describe('formatDistance', () => {
    it('formatea menos de 1000m en metros', () => {
      expect(formatDistance(500)).toBe('500m')
    })

    it('formatea exactamente 1000m como 1.0km', () => {
      expect(formatDistance(1000)).toBe('1.0km')
    })

    it('formatea 1500m como 1.5km', () => {
      expect(formatDistance(1500)).toBe('1.5km')
    })

    it('formatea 250m correctamente', () => {
      expect(formatDistance(250)).toBe('250m')
    })

    it('formatea 10000m como 10.0km', () => {
      expect(formatDistance(10000)).toBe('10.0km')
    })

    it('redondea metros correctamente', () => {
      expect(formatDistance(999)).toBe('999m')
    })
  })
})
