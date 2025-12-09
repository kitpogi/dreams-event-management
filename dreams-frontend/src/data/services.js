// Centralized services data for D'Dreams Events and Styles
export const services = [
  {
    id: 1,
    icon: 'cake',
    title: 'Debut Planning',
    description: 'Make your 18th birthday celebration truly unforgettable with our complete debut planning services.',
    details: 'From the cotillion dance to the 18 roses and candles ceremony, we handle every detail to make your transition to adulthood magical and memorable.',
    link: '/packages'
  },
  {
    id: 2,
    icon: 'favorite',
    title: 'Wedding Events',
    description: 'Create the wedding of your dreams with our comprehensive planning and styling services.',
    details: 'From intimate ceremonies to grand receptions, we bring your vision to life with elegant design, seamless coordination, and attention to every detail.',
    link: '/packages'
  },
  {
    id: 3,
    icon: 'celebration',
    title: 'Birthday Parties',
    description: 'Celebrate another year with style through our creative and fun birthday party planning.',
    details: 'Whether it\'s a milestone birthday, kids party, or adult celebration, we create personalized experiences with themed decor, entertainment, and more.',
    link: '/packages'
  },
  {
    id: 4,
    icon: 'emoji_events',
    title: 'Pageant Events',
    description: 'Professional pageant event management for competitions, beauty contests, and award ceremonies.',
    details: 'From stage design and lighting to program flow and coordination, we ensure your pageant runs smoothly and professionally.',
    link: '/packages'
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

