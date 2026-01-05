// Constants for event form

// Event-type-specific motifs
export const MOTIFS_BY_EVENT_TYPE = {
  wedding: [
    'Whimsic',
    'Vintage',
    'Civil',
    'Tradition',
    'Micro',
    'Elopeme',
    'Modern',
    'Interfaith',
  ],
  debut: [
    'Elegant',
    'Princess',
    'Glamour',
    'Modern',
    'Vintage',
    'Garden',
    'Ballroom',
    'Classic',
  ],
  birthday: [
    'Princess',
    'Superhero',
    'Sports',
    'Rainbow',
    'Cartoon',
    'Elegant',
    'Fun',
    'Colorful',
    'Themed',
    'Adventure',
  ],
  pageant: [
    'Glamour',
    'Elegant',
    'Classic',
    'Modern',
    'Vintage',
    'Royal',
    'Formal',
    'Sophisticated',
  ],
  corporate: [
    'Professional',
    'Modern',
    'Minimalist',
    'Elegant',
    'Formal',
    'Business',
    'Contemporary',
    'Classic',
  ],
  anniversary: [
    'Romantic',
    'Elegant',
    'Vintage',
    'Classic',
    'Modern',
    'Garden',
    'Formal',
    'Intimate',
  ],
  other: [
    'Elegant',
    'Modern',
    'Vintage',
    'Classic',
    'Casual',
    'Formal',
    'Themed',
    'Custom',
  ],
};

// Default motifs (for backward compatibility)
export const MOTIFS_OPTIONS = MOTIFS_BY_EVENT_TYPE.wedding;

// Helper function to get motifs for a specific event type
export const getMotifsForEventType = (eventType) => {
  return MOTIFS_BY_EVENT_TYPE[eventType] || MOTIFS_BY_EVENT_TYPE.other;
};

export const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'debut', label: 'Debut' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'pageant', label: 'Pageant' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'other', label: 'Other' },
];

export const STORAGE_KEY = 'set-an-event-form-data';

export const SORT_OPTIONS = [
  { value: 'match-score', label: 'Match Score (High to Low)' },
  { value: 'price-low', label: 'Price (Low to High)' },
  { value: 'price-high', label: 'Price (High to Low)' },
];

export const PRICE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Packages' },
  { value: 'within-budget', label: 'Within Budget' },
  { value: 'over-budget', label: 'Slightly Over Budget' },
];

