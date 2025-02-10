declare module 'vue-toastification' {
  import { Plugin } from 'vue'
  
  export interface PluginOptions {
    position?: string
    timeout?: number
    closeOnClick?: boolean
    pauseOnFocusLoss?: boolean
    pauseOnHover?: boolean
    draggable?: boolean
    draggablePercent?: number
    showCloseButtonOnHover?: boolean
    hideProgressBar?: boolean
    closeButton?: string
    icon?: boolean
    rtl?: boolean
    transition?: string
    maxToasts?: number
    newestOnTop?: boolean
  }

  const plugin: Plugin
  export default plugin
}
