export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    
  }

  export function formatDate(date: string): string {
    // Evita el desfase de zona horaria: 'YYYY-MM-DD' se interpreta como
    // UTC medianoche por el constructor Date, lo que retrocede un día
    // al formatear en zonas horarias negativas respecto a UTC (ej. UTC-4).
    // Se parsean los componentes manualmente para construir la fecha en
    // hora local en vez de dejar que Date asuma UTC.
    let parsedDate: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);
      parsedDate = new Date(year, month - 1, day);
    } else {
      parsedDate = new Date(date);
    }
    return new Intl.DateTimeFormat("en-US").format(parsedDate);
  }

  export function formatPercentage(percentage: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
    }).format(percentage);
  }

  export function formatNumber(amount: number): string {
    return new Intl.NumberFormat("en-US").format(amount);
  }

  export function formatTime(date: string): string {
    return new Intl.DateTimeFormat("en-US", {
      timeStyle: "short",
    }).format(new Date(date));
  }

  