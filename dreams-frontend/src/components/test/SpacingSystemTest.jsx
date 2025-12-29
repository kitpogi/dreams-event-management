/**
 * Spacing System Test Component
 * 
 * Use this component to verify that the spacing system is working correctly.
 * Add it temporarily to any page to test spacing utilities.
 * 
 * Usage:
 * import SpacingSystemTest from '@/components/test/SpacingSystemTest';
 * 
 * Then add <SpacingSystemTest /> to your component
 */

const SpacingSystemTest = () => {
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-8">Spacing System Verification</h1>
        
        {/* Component Spacing Test */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Component Spacing</h2>
          <div className="space-y-4">
            <div className="p-component-xs bg-blue-100 dark:bg-blue-900 rounded border border-blue-300">
              <strong>XS:</strong> p-component-xs (4px padding)
            </div>
            <div className="p-component-sm bg-blue-200 dark:bg-blue-800 rounded border border-blue-400">
              <strong>SM:</strong> p-component-sm (8px padding)
            </div>
            <div className="p-component-md bg-blue-300 dark:bg-blue-700 rounded border border-blue-500">
              <strong>MD:</strong> p-component-md (16px padding)
            </div>
            <div className="p-component-lg bg-blue-400 dark:bg-blue-600 rounded border border-blue-600">
              <strong>LG:</strong> p-component-lg (24px padding)
            </div>
            <div className="p-component-xl bg-blue-500 dark:bg-blue-500 rounded border border-blue-700">
              <strong>XL:</strong> p-component-xl (32px padding)
            </div>
          </div>
        </section>

        {/* Gap Test */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Gap Utilities</h2>
          <div className="gap-component-sm flex flex-wrap">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">Item 1</div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">Item 2</div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">Item 3</div>
          </div>
          <div className="gap-component-md flex flex-wrap mt-4">
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded">Item 1</div>
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded">Item 2</div>
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded">Item 3</div>
          </div>
          <div className="gap-component-lg flex flex-wrap mt-4">
            <div className="p-2 bg-green-300 dark:bg-green-700 rounded">Item 1</div>
            <div className="p-2 bg-green-300 dark:bg-green-700 rounded">Item 2</div>
            <div className="p-2 bg-green-300 dark:bg-green-700 rounded">Item 3</div>
          </div>
        </section>

        {/* Section Spacing Test */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Section Spacing</h2>
          <div className="py-section-xs bg-purple-100 dark:bg-purple-900 rounded mb-4">
            <p className="px-4">py-section-xs (32px vertical padding)</p>
          </div>
          <div className="py-section-sm bg-purple-200 dark:bg-purple-800 rounded mb-4">
            <p className="px-4">py-section-sm (48px vertical padding)</p>
          </div>
          <div className="py-section-md bg-purple-300 dark:bg-purple-700 rounded mb-4">
            <p className="px-4">py-section-md (64px vertical padding)</p>
          </div>
        </section>

        {/* Layout Spacing Test */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Layout Spacing</h2>
          <div className="px-layout-xs bg-orange-100 dark:bg-orange-900 rounded mb-2">
            <p>px-layout-xs (16px horizontal padding)</p>
          </div>
          <div className="px-layout-sm bg-orange-200 dark:bg-orange-800 rounded mb-2">
            <p>px-layout-sm (24px horizontal padding)</p>
          </div>
          <div className="px-layout-md bg-orange-300 dark:bg-orange-700 rounded mb-2">
            <p>px-layout-md (32px horizontal padding)</p>
          </div>
          <div className="px-layout-lg bg-orange-400 dark:bg-orange-600 rounded mb-2">
            <p>px-layout-lg (48px horizontal padding)</p>
          </div>
        </section>

        {/* Margin Test */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Margin Utilities</h2>
          <div className="mb-component-xs bg-red-100 dark:bg-red-900 rounded p-2">mb-component-xs</div>
          <div className="mb-component-sm bg-red-200 dark:bg-red-800 rounded p-2">mb-component-sm</div>
          <div className="mb-component-md bg-red-300 dark:bg-red-700 rounded p-2">mb-component-md</div>
          <div className="mb-component-lg bg-red-400 dark:bg-red-600 rounded p-2">mb-component-lg</div>
        </section>

        {/* Space Between Test */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Space Between Utilities</h2>
          <div className="space-y-component-sm">
            <div className="bg-yellow-100 dark:bg-yellow-900 rounded p-2">Item 1</div>
            <div className="bg-yellow-100 dark:bg-yellow-900 rounded p-2">Item 2</div>
            <div className="bg-yellow-100 dark:bg-yellow-900 rounded p-2">Item 3</div>
          </div>
          <div className="space-y-component-md mt-4">
            <div className="bg-yellow-200 dark:bg-yellow-800 rounded p-2">Item 1</div>
            <div className="bg-yellow-200 dark:bg-yellow-800 rounded p-2">Item 2</div>
            <div className="bg-yellow-200 dark:bg-yellow-800 rounded p-2">Item 3</div>
          </div>
        </section>

        {/* Verification Status */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-green-500">
          <h2 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">
            ✅ Verification Checklist
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>All padding boxes should show different sizes</li>
            <li>Gap between items should increase from sm to lg</li>
            <li>Section spacing should be noticeably larger</li>
            <li>Layout spacing should be visible horizontally</li>
            <li>Margin spacing should create space between elements</li>
            <li>Space between should add vertical spacing automatically</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            If all items above are visible and properly spaced, the spacing system is working correctly!
          </p>
        </section>
      </div>
    </div>
  );
};

export default SpacingSystemTest;

