export const CITIES = ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Kyzylorda'];
export const TYPES = ['Library', 'Café', 'Coworking', 'Campus'];
export const NOISE_LEVELS = ['Quiet', 'Moderate', 'Lively'];
export const SORT_OPTIONS = [
  ['recommended', 'Top rated'], ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'], ['name', 'Name: A–Z'], ['newest', 'Recently added'],
];
export const PAGE_SIZE = 9;
export const formatPrice = (price) => price === 0 ? 'Free' : `₸${new Intl.NumberFormat('en-US').format(price)}`;
