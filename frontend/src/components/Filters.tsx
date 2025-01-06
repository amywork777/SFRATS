import React from 'react';

export default function Filters({ 
  searchQuery, 
  setSearchQuery,
  selectedCategories,
  toggleCategory,
  dateRange,
  handleStartDateChange,
  handleEndDateChange,
  showFilters,
  setShowFilters
}) {
  const categories = ['Items', 'Food', 'Events', 'Services'];
  const categoryEmojis = {
    'Items': '📦',
    'Food': '🍕',
    'Events': '🎉',
    'Services': '🔧'
  };

  return (
    <>
      {/* Search Bar - Always visible */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 px-3 py-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-200 text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <button
            onClick={() => setShowFilters(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
          >
            Filters
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          
          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-medium">Filter Listings</h2>
              <button onClick={() => setShowFilters(false)} className="p-2">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                        ${selectedCategories.includes(category)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      <span>{categoryEmojis[category]}</span>
                      <span>{category}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 className="text-sm font-medium mb-2">Available Date</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={dateRange.start?.toISOString().split('T')[0] || ''}
                      onChange={handleStartDateChange}
                      className="w-full px-3 py-1.5 rounded-lg border text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={dateRange.end?.toISOString().split('T')[0] || ''}
                      onChange={handleEndDateChange}
                      className="w-full px-3 py-1.5 rounded-lg border text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    // Reset filters logic here
                    setShowFilters(false);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 