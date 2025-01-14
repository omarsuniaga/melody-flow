// Agregar un tipo de guarda para verificar eventos
export function isMusicEvent(event) {
    return (event &&
        typeof event.id === 'string' &&
        typeof event.provider === 'string' &&
        typeof event.description === 'string' &&
        typeof event.location === 'string' &&
        typeof event.time === 'string' &&
        typeof event.amount === 'number' &&
        typeof event.date === 'string');
}
