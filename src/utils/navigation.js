// Global navigation helper to avoid circular dependencies
let navigateFunction = null;

export const setNavigate = (navigate) => {
  navigateFunction = navigate;
};

export const navigateTo = (path, options = {}) => {
  if (navigateFunction) {
    navigateFunction(path, { replace: true, ...options });
  } else {
    // Wait a bit for navigate to be set (in case it's called during initial render)
    setTimeout(() => {
      if (navigateFunction) {
        navigateFunction(path, { replace: true, ...options });
      } else {
        console.warn('Navigate function not set, using fallback');
        // Only use window.location as absolute last resort
        window.location.replace(path);
      }
    }, 100);
  }
};

const navigation = { setNavigate, navigateTo };
export default navigation;
