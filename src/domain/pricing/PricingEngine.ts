import type {
  EventDetails,
  NegotiationPolicy,
  PricingBreakdown,
  PricingResult
} from '../../types/negotiation'

const WEEKEND_DAYS = [0, 6]
const NIGHT_START_HOUR = 20

function parseHour(time: string | null): number | null {
  if (!time) return null
  const [h] = time.split(':')
  const hour = Number(h)
  return Number.isFinite(hour) ? hour : null
}

function isWeekend(dateStr: string | null): boolean {
  if (!dateStr) return false
  const day = new Date(dateStr).getDay()
  return WEEKEND_DAYS.includes(day)
}

function isNightSchedule(startTime: string | null): boolean {
  const hour = parseHour(startTime)
  if (hour === null) return false
  return hour >= NIGHT_START_HOUR || hour < 5
}

/**
 * Calcula el precio recomendado a partir de los datos CONOCIDOS del evento
 * y las políticas configuradas por el usuario (spec sección 7-8). Nunca usa
 * cifras universales fijas: todo sale de `policy`.
 */
export function calculatePricing(event: EventDetails, policy: NegotiationPolicy): PricingResult {
  const explanation: string[] = []

  const isRecurring = event.isRecurring.value === true
  const base = isRecurring ? policy.recurringRate : policy.oneTimeRate
  explanation.push(`${isRecurring ? 'Tarifa recurrente' : 'Tarifa evento puntual'} base: +${base}`)

  const setsCount = event.timing.setsCount.value ?? 1
  const extraSets = Math.max(0, setsCount - 1)
  const additionalSetRate = extraSets * policy.extraSetRate
  if (extraSets > 0) explanation.push(`${extraSets} set(s) adicionales: +${additionalSetRate}`)

  const reservedMinutes = event.timing.reservedMinutes ?? 0
  const extraHours = Math.max(0, Math.ceil((reservedMinutes - 120) / 60))
  const availabilityRate = extraHours * policy.extraHourRate
  if (extraHours > 0) explanation.push(`${extraHours}h adicionales de disponibilidad: +${availabilityRate}`)

  const waitingMinutes = event.timing.waitingMinutes ?? 0
  const waitingRate = waitingMinutes > 0 ? Math.ceil(waitingMinutes / 60) * policy.waitingRate : 0
  if (waitingRate > 0) explanation.push(`Espera fragmentando la jornada: +${waitingRate}`)

  const setupMinutes = event.timing.setupMinutes ?? 0
  const setupRate = setupMinutes > 60 ? policy.extraHourRate * 0.5 : 0
  if (setupRate > 0) explanation.push(`Montaje/prueba de sonido extendida: +${setupRate}`)

  const travelRate = event.timing.travelMinutes && event.timing.travelMinutes > 30 ? policy.travelRate : 0
  if (travelRate > 0) explanation.push(`Transporte/distancia: +${travelRate}`)

  const specialRepertoireRate =
    event.specialRepertoireRequested.value === true ? policy.specialRepertoireRate : 0
  if (specialRepertoireRate > 0) explanation.push(`Repertorio especial: +${specialRepertoireRate}`)

  const equipmentRate =
    event.soundCondition.value === 'SOUND_MUSICIAN' || event.soundCondition.value === 'SOUND_EXTERNAL_PROVIDER'
      ? policy.soundEquipmentRate
      : 0
  if (equipmentRate > 0) explanation.push(`Sonido/equipo a cargo del músico: +${equipmentRate}`)

  const holidayRate = isWeekend(event.date.value) || isNightSchedule(event.timing.startTime.value)
    ? policy.urgencyRate * 0.5
    : 0
  if (holidayRate > 0) explanation.push(`Fin de semana / horario nocturno: +${holidayRate}`)

  const urgencyRate = 0 // Reservado para señales de urgencia detectadas por el analizador de conversación.

  const breakdown: PricingBreakdown = {
    baseRate: base,
    performanceRate: 0,
    availabilityRate,
    setupRate,
    travelRate,
    specialRepertoireRate,
    equipmentRate,
    urgencyRate,
    holidayRate,
    additionalSetRate,
    waitingRate
  }

  const recommendedPrice = Object.values(breakdown).reduce((sum, v) => sum + v, 0)
  explanation.push(`Total sugerido: ${recommendedPrice}`)

  const openingPrice = Math.round(recommendedPrice * (1 + policy.negotiationMarginPercent / 100))
  const targetPrice = recommendedPrice
  const comfortablePrice = Math.round(
    recommendedPrice * (1 - policy.negotiationMarginPercent / 200)
  )
  const floorPrice = Math.max(policy.absoluteFloorPrice, policy.minimumRate)

  return {
    breakdown,
    recommendedPrice,
    openingPrice,
    targetPrice,
    comfortablePrice,
    floorPrice: Math.min(floorPrice, comfortablePrice),
    explanation
  }
}

/** Evalúa una contraoferta contra las políticas, sin decidir por sí sola (spec sección 15-16). */
export function evaluateCounterOffer(
  offer: number,
  pricing: PricingResult
): 'ACCEPTABLE' | 'REQUIRES_APPROVAL' | 'RECOMMEND_DECLINE' {
  if (offer >= pricing.comfortablePrice) return 'ACCEPTABLE'
  if (offer >= pricing.floorPrice) return 'REQUIRES_APPROVAL'
  return 'RECOMMEND_DECLINE'
}
