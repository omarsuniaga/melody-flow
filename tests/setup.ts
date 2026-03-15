import { vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// --- Pinia: activar instancia fresca en cada test ---
beforeEach(() => {
  setActivePinia(createPinia())
})

// --- localStorage mock ---
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// --- navigator.geolocation mock base (sobreescribible por test) ---
Object.defineProperty(globalThis.navigator, 'geolocation', {
  configurable: true,
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
})

// --- Firebase mock global ---
vi.mock('../src/firebase/config', () => ({
  auth: { currentUser: null },
  db: {},
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}))

// --- leaflet mock (evita errores de DOM en tests de RouteService) ---
vi.mock('leaflet', () => ({ default: {} }))
vi.mock('leaflet-routing-machine', () => ({}))

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
