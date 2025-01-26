export class IPService {
  private static instance: IPService;
  private cachedIP: string | null = null;

  private constructor() {}

  public static getInstance(): IPService {
    if (!IPService.instance) {
      IPService.instance = new IPService();
    }
    return IPService.instance;
  }

  public async getDeviceIP(): Promise<string> {
    if (this.cachedIP) {
      return this.cachedIP;
    }

    try {
      // Intentar obtener la IP usando un servicio externo
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      this.cachedIP = data.ip;
      return this.cachedIP;
    } catch (error) {
      console.error('Error al obtener IP:', error);
      // Si falla, intentar con otro servicio
      try {
        const response = await fetch('https://api.ipapi.com/api/check?access_key=YOUR_API_KEY');
        const data = await response.json();
        this.cachedIP = data.ip;
        return this.cachedIP;
      } catch (error) {
        console.error('Error al obtener IP (backup):', error);
        return 'unknown';
      }
    }
  }
}
