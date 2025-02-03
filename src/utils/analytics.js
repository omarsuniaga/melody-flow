
import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '../firebase/config';

const analytics = getAnalytics(app);

export const logPageView = (pagePath, pageTitle) => {
    logEvent(analytics, 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.href
    });
};