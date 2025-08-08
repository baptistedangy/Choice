// Simple analytics utility for MVP
class Analytics {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  track(eventName, properties = {}) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    // Store locally for now
    this.events.push(event);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }

    // In production, you would send to your analytics service
    // this.sendToAnalyticsService(event);
    
    // Store in localStorage for persistence
    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    try {
      const recentEvents = this.events.slice(-100); // Keep last 100 events
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to save analytics to localStorage:', error);
    }
  }

  // Common tracking methods
  trackPageView(pageName) {
    this.track('page_view', { page: pageName });
  }

  trackMenuScan(success = true, errorMessage = null) {
    this.track('menu_scan', { 
      success, 
      error_message: errorMessage,
      scan_timestamp: Date.now()
    });
  }

  trackRecommendationClick(dishName, rank, aiScore) {
    this.track('recommendation_click', {
      dish_name: dishName,
      rank: rank,
      ai_score: aiScore
    });
  }

  trackUserPreferences(preferences) {
    this.track('user_preferences_updated', {
      dietary_preferences: preferences.dietaryPreferences || [],
      budget: preferences.budget,
      goal: preferences.goal
    });
  }

  trackOnboardingComplete(timeSpent) {
    this.track('onboarding_complete', {
      time_spent_seconds: timeSpent
    });
  }

  trackError(error, context = {}) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      context: context
    });
  }

  // Get analytics data for debugging
  getEvents() {
    return this.events;
  }

  // Clear analytics data
  clear() {
    this.events = [];
    localStorage.removeItem('analytics_events');
  }
}

// Create singleton instance
const analytics = new Analytics();

export default analytics;

// Convenience exports
export const trackPageView = (pageName) => analytics.trackPageView(pageName);
export const trackMenuScan = (success, errorMessage) => analytics.trackMenuScan(success, errorMessage);
export const trackRecommendationClick = (dishName, rank, aiScore) => analytics.trackRecommendationClick(dishName, rank, aiScore);
export const trackUserPreferences = (preferences) => analytics.trackUserPreferences(preferences);
export const trackOnboardingComplete = (timeSpent) => analytics.trackOnboardingComplete(timeSpent);
export const trackError = (error, context) => analytics.trackError(error, context);