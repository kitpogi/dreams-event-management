// Centralized services data for D'Dreams Events and Styles
export const services = [
  {
    id: 1,
    category: 'Debut',
    icon: 'cake',
    title: 'Debut Planning',
    description: 'Starting from ₱25,000',
    details: 'Complete 18th birthday celebration management including cotillion, 18 roses, and candles.',
    rating: 4.9,
    images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800'],
    link: '/packages'
  },
  {
    id: 2,
    category: 'Wedding',
    icon: 'favorite',
    title: 'Wedding Events',
    description: 'Starting from ₱50,000',
    details: 'Elegant design and seamless coordination for your walk down the aisle.',
    rating: 5.0,
    images: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'],
    link: '/packages'
  },
  {
    id: 3,
    category: 'Birthday',
    icon: 'celebration',
    title: 'Birthday Parties',
    description: 'Starting from ₱15,000',
    details: 'Themed decor and fun entertainment for all ages and milestones.',
    rating: 4.8,
    images: ['https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&q=80&w=800'],
    link: '/packages'
  },
  {
    id: 4,
    category: 'Pageant',
    icon: 'emoji_events',
    title: 'Miss Jimalalud 2026',
    description: 'Professional Pageant Management',
    details: 'Stage design, lighting, and coordination for beauty contests.',
    rating: 4.9,
    images: [
      '/assets/services/pageants/miss_jimalalud_2026_1.jpg',
      '/assets/services/pageants/miss_jimalalud_2023.jpg',
      '/assets/services/pageants/miss_jimalalud_2019.jpg'
    ],
    link: '/portfolio'
  },
  {
    id: 5,
    category: 'Corporate',
    icon: 'business',
    title: 'Corporate Galas',
    description: 'Starting from ₱40,000',
    details: 'Professional events, product launches, and award ceremonies.',
    rating: 4.7,
    images: ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800'],
    link: '/packages'
  },
  {
    id: 6,
    category: 'Pageant',
    icon: 'star',
    title: 'Miss Jimalalud 2023',
    description: 'Spectacular Event Production',
    details: 'Full event production services for the 2023 pageant.',
    rating: 4.9,
    images: ['/assets/services/pageants/miss_jimalalud_2023.jpg'],
    link: '/portfolio'
  }
];

// Helper function to get all services
export const getAllServices = () => {
  return services;
};

// Helper function to get service by id
export const getServiceById = (id) => {
  return services.find(service => service.id === id);
};

// Helper function to get service by title
export const getServiceByTitle = (title) => {
  return services.find(service => service.title.toLowerCase().includes(title.toLowerCase()));
};

// Helper to get all categories
export const getCategories = () => {
  return ['All', ...new Set(services.map(s => s.category))];
};

