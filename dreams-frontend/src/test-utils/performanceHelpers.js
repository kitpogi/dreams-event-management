/**
 * Performance testing utilities
 */

/**
 * Measure component render time
 */
export const measureRenderTime = async (renderFn) => {
  const start = performance.now();
  await renderFn();
  const end = performance.now();
  return end - start;
};

/**
 * Measure function execution time
 */
export const measureExecutionTime = (fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return {
    result,
    time: end - start,
  };
};

/**
 * Measure async function execution time
 */
export const measureAsyncExecutionTime = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    time: end - start,
  };
};

/**
 * Test component re-render performance
 */
export const testRerenderPerformance = async (component, propsUpdates, iterations = 10) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const { rerender } = component;
    const start = performance.now();
    rerender(propsUpdates);
    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for render
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times,
  };
};

/**
 * Test memory usage
 */
export const measureMemoryUsage = () => {
  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    };
  }
  return null;
};

/**
 * Test bundle size (mock - would need webpack-bundle-analyzer in real scenario)
 */
export const getBundleSize = () => {
  // This would typically be done at build time
  return {
    message: 'Bundle size analysis should be done at build time with webpack-bundle-analyzer',
  };
};

/**
 * Test component mount/unmount performance
 */
export const testMountUnmountPerformance = async (mountFn, unmountFn, iterations = 100) => {
  const mountTimes = [];
  const unmountTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    // Mount
    const mountStart = performance.now();
    const instance = await mountFn();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const mountEnd = performance.now();
    mountTimes.push(mountEnd - mountStart);
    
    // Unmount
    const unmountStart = performance.now();
    await unmountFn(instance);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const unmountEnd = performance.now();
    unmountTimes.push(unmountEnd - unmountStart);
  }
  
  return {
    mount: {
      average: mountTimes.reduce((a, b) => a + b, 0) / mountTimes.length,
      min: Math.min(...mountTimes),
      max: Math.max(...mountTimes),
    },
    unmount: {
      average: unmountTimes.reduce((a, b) => a + b, 0) / unmountTimes.length,
      min: Math.min(...unmountTimes),
      max: Math.max(...unmountTimes),
    },
  };
};

/**
 * Test scroll performance
 */
export const testScrollPerformance = async (container, scrollDistance = 1000) => {
  const start = performance.now();
  
  container.scrollTop = scrollDistance;
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  const end = performance.now();
  return end - start;
};

/**
 * Test animation performance
 */
export const testAnimationPerformance = async (element, animationClass) => {
  const start = performance.now();
  
  element.classList.add(animationClass);
  
  return new Promise((resolve) => {
    const handleAnimationEnd = () => {
      const end = performance.now();
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve(end - start);
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
    
    // Fallback timeout
    setTimeout(() => {
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve(performance.now() - start);
    }, 5000);
  });
};

