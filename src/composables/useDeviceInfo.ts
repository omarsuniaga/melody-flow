export function useDeviceInfo() {
  async function collectDeviceInfo() {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const language = navigator.language
    const screenResolution = `${window.screen.width}x${window.screen.height}`
    const colorDepth = window.screen.colorDepth
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Parse user agent for browser and OS info
    const browserInfo = {
      name: getBrowserName(userAgent),
      version: getBrowserVersion(userAgent)
    }

    const osInfo = {
      name: getOSName(userAgent),
      version: getOSVersion(userAgent)
    }

    return {
      browser: browserInfo,
      os: osInfo,
      platform,
      language,
      screenResolution,
      colorDepth,
      timezone
    }
  }

  function getBrowserName(userAgent: string): string {
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  function getBrowserVersion(userAgent: string): string {
    const matches = userAgent.match(/(firefox|chrome|safari|edge|opera(?=\/))\/?\s*(\d+)/i)
    return matches ? matches[2] : 'Unknown'
  }

  function getOSName(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'MacOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  function getOSVersion(userAgent: string): string {
    const matches = userAgent.match(/(?:windows nt|mac os x|android|ios) (\d+([._]\d+)*)/i)
    return matches ? matches[1].replace(/_/g, '.') : 'Unknown'
  }

  return {
    collectDeviceInfo
  }
}