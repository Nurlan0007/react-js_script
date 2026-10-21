import { CITIES, TYPES, NOISE_LEVELS, PAGE_SIZE } from '../data/options.js';

export function validateSpace(values) {
  const errors = {};
  if (!values.name?.trim() || values.name.trim().length < 3) errors.name = 'Enter a name with at least 3 characters.';
  if (values.name?.length > 80) errors.name = 'Use 80 characters or fewer.';
  if (!CITIES.includes(values.city)) errors.city = 'Choose a city.';
  if (!TYPES.includes(values.type)) errors.type = 'Choose a space type.';
  if (!values.address?.trim() || values.address.trim().length < 5) errors.address = 'Enter a street and building number.';
  if (values.address?.length > 160) errors.address = 'Use 160 characters or fewer.';
  if (!values.description?.trim() || values.description.trim().length < 30) errors.description = 'Describe the space in at least 30 characters.';
  if (values.description?.length > 1000) errors.description = 'Use 1,000 characters or fewer.';
  if (!NOISE_LEVELS.includes(values.noise)) errors.noise = 'Choose an atmosphere.';
  if (values.price === '' || !Number.isFinite(Number(values.price)) || Number(values.price) < 0 || Number(values.price) > 50000) errors.price = 'Enter a price from 0 to 50,000 tenge.';
  if (values.seats === '' || !Number.isInteger(Number(values.seats)) || Number(values.seats) < 1 || Number(values.seats) > 1000) errors.seats = 'Enter a whole number from 1 to 1,000.';
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(values.openingTime || '')) errors.openingTime = 'Enter a valid opening time.';
  if (!time.test(values.closingTime || '') || values.closingTime <= values.openingTime) errors.closingTime = 'Closing time must be after opening time (same day).';
  return errors;
}

// Apply every transformation to the full collection; paginate only at the end.
export function querySpaces(spaces, filters = {}, savedIds = []) {
  const search = (filters.q || '').trim().toLowerCase();
  const filtered = spaces.filter((space) => {
    const text = `${space.name} ${space.city} ${space.address} ${space.description}`.toLowerCase();
    return (!search || text.includes(search))
      && (!filters.city || space.city === filters.city)
      && (!filters.type || space.type === filters.type)
      && (!filters.noise || space.noise === filters.noise)
      && (!filters.free || space.price === 0)
      && (!filters.wifi || space.wifi)
      && (!filters.outlets || space.outlets)
      && (!filters.savedOnly || savedIds.includes(space.id));
  });
  const comparators = {
    recommended: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  };
  const compare = comparators[filters.sort] || comparators.recommended;
  const sorted = [...filtered].sort((a, b) => compare(a, b) || a.id.localeCompare(b.id));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const requestedPage = Math.floor(Number(filters.page)) || 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return { items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: sorted.length, page, totalPages };
}
