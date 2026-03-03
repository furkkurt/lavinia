// Debug utility to help identify memory leaks
// Enable by setting NEXT_PUBLIC_DEBUG_MEMORY=true in .env.local

const DEBUG_MEMORY = process.env.NEXT_PUBLIC_DEBUG_MEMORY === 'true';

let apiCallCount = 0;
let componentMountCount = 0;
let componentUnmountCount = 0;

export const debugMemory = {
  logApiCall: (endpoint: string) => {
    if (DEBUG_MEMORY) {
      apiCallCount++;
      console.log(`[MEMORY DEBUG] API Call #${apiCallCount}: ${endpoint}`);
      if (apiCallCount % 10 === 0) {
        console.warn(`[MEMORY DEBUG] Warning: ${apiCallCount} API calls made`);
      }
    }
  },
  
  logComponentMount: (componentName: string) => {
    if (DEBUG_MEMORY) {
      componentMountCount++;
      console.log(`[MEMORY DEBUG] Component Mount #${componentMountCount}: ${componentName}`);
    }
  },
  
  logComponentUnmount: (componentName: string) => {
    if (DEBUG_MEMORY) {
      componentUnmountCount++;
      console.log(`[MEMORY DEBUG] Component Unmount #${componentUnmountCount}: ${componentName}`);
      const diff = componentMountCount - componentUnmountCount;
      if (diff > 5) {
        console.warn(`[MEMORY DEBUG] Warning: ${diff} components mounted but not unmounted!`);
      }
    }
  },
  
  getStats: () => {
    if (DEBUG_MEMORY) {
      return {
        apiCalls: apiCallCount,
        mounts: componentMountCount,
        unmounts: componentUnmountCount,
        leak: componentMountCount - componentUnmountCount
      };
    }
    return null;
  },
  
  reset: () => {
    apiCallCount = 0;
    componentMountCount = 0;
    componentUnmountCount = 0;
  }
};
