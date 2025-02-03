export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    
  }

  export function formatDate(date: string): string {
    return new Intl.DateTimeFormat("en-US").format(new Date(date));
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

  