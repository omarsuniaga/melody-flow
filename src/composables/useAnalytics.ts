// import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics'
// import { auth } from '../firebase/config'

// export function useAnalytics() {
//   const analytics = getAnalytics()

//   function logEvent(eventName: string, eventParams?: Record<string, any>) {
//     const userId = auth.currentUser?.uid
//     const params = {
//       ...eventParams,
//       userId,
//       timestamp: new Date().toISOString()
//     }

//     firebaseLogEvent(analytics, eventName, params)
//   }

//   return {
//     logEvent
//   }
// }