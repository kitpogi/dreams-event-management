import { render, screen } from '@testing-library/react';
import Button from '../Button';
import {
  measureRenderTime,
  measureExecutionTime,
  testRerenderPerformance,
} from '../../../test-utils/performanceHelpers';

describe('Button Performance', () => {
  it('renders quickly', async () => {
    const renderTime = await measureRenderTime(() => {
      render(<Button>Test</Button>);
    });
    
    // Button should render in less than 200ms (more realistic for test environment)
    expect(renderTime).toBeLessThan(200);
  });

  it('handles multiple renders efficiently', async () => {
    const { rerender } = render(<Button>Initial</Button>);
    
    const performance = await testRerenderPerformance(
      { rerender },
      <Button>Updated</Button>,
      10
    );
    
    // Average render time should be reasonable (more realistic for test environment)
    expect(performance.average).toBeLessThan(100);
  });

  it('executes click handler quickly', () => {
    const handleClick = jest.fn();
    const { result, time } = measureExecutionTime(() => {
      handleClick();
    });
    
    expect(time).toBeLessThan(5); // Click should be fast (more realistic for test environment)
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not cause memory leaks with multiple instances', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Create and unmount multiple buttons
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<Button>Button {i}</Button>);
      unmount();
    }
    
    // Force garbage collection if available (not available in all environments)
    if (global.gc) {
      global.gc();
    }
    
    // Memory should not have grown excessively
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Allow some memory increase but not excessive
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
  });
});

