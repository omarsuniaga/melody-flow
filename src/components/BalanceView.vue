const getEventsForMonth = (year: number, month: number) => {
  // Corregir el filtrado para incluir correctamente el día 1
  return events.value.filter(event => {
    // Asegurarse de que event.date existe
    if (!event.date) return false;
    
    // Convertir la fecha del evento a objeto Date
    const eventDate = new Date(event.date);
    
    // Extraer año y mes (0-11) del evento
    const eventYear = eventDate.getFullYear();
    const eventMonth = eventDate.getMonth();
    
    // Comparar año y mes (sin considerar el día)
    return eventYear === year && eventMonth === month;
  });
}; 