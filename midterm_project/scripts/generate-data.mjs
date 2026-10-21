import { mkdir, writeFile } from 'node:fs/promises';

// Deterministic fictional fixtures: 6 cities × 20 spaces = 120 initial records.
// These are not verified businesses or real ratings.
const cities = ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Kyzylorda'];
const streets = ['Abai Avenue', 'Tauelsizdik Street', 'Dostyk Avenue', 'Baitursynov Street'];
const venues = [
  ['The Reading Room', 'Library'], ['Juniper & Coffee', 'Café'],
  ['Common Ground', 'Coworking'], ['Campus Corner', 'Campus'],
  ['Chapter One', 'Library'], ['Slow Morning', 'Café'],
  ['The Focus Studio', 'Coworking'], ['Open Notes', 'Campus'],
  ['Birch Library', 'Library'], ['Paper Cup', 'Café'],
  ['North Desk', 'Coworking'], ['The Learning Loft', 'Campus'],
  ['Quiet Pages', 'Library'], ['Sage & Steam', 'Café'],
  ['Workroom', 'Coworking'], ['Discovery Hall', 'Campus'],
  ['The Book Garden', 'Library'], ['Little Window', 'Café'],
  ['Assembly Space', 'Coworking'], ['Ideas Lab', 'Campus'],
];
const descriptions = {
  Library: 'Settle into a bright reading room with generous desks, reference shelves, and a calm atmosphere. A comfortable choice for deep reading, revision, and a little uninterrupted thinking.',
  Café: 'A welcoming neighborhood café with warm light and dedicated laptop tables. Bring your notes, order something comforting, and enjoy a relaxed setting for your next study session.',
  Coworking: 'A thoughtfully arranged shared workspace with spacious desks and room to collaborate. Well suited to project work, online classes, and a productive afternoon away from home.',
  Campus: 'An informal learning space designed for students. Spread out your materials, prepare for your next class, or work through a group assignment in a friendly academic setting.',
};
const spaces = cities.flatMap((city, cityIndex) => venues.map(([name, type], index) => {
  const number = cityIndex * venues.length + index + 1;
  return {
    id: `space-${String(number).padStart(3, '0')}`, name: `${name} · ${city}`,
    city, type, address: `${12 + index * 3}, ${streets[(index + cityIndex) % streets.length]}`,
    description: descriptions[type],
    noise: type === 'Library' ? 'Quiet' : type === 'Café' ? 'Lively' : index % 3 === 0 ? 'Quiet' : 'Moderate',
    price: type === 'Library' || type === 'Campus' ? 0 : (type === 'Café' ? 500 : 1000) + ((index + cityIndex) % 4) * 250,
    wifi: number % 7 !== 0, outlets: number % 5 !== 0,
    seats: 16 + (number * 7) % 85, rating: Number((4 + ((number * 3) % 10) / 10).toFixed(1)),
    reviewCount: 12 + (number * 13) % 180,
    openingTime: type === 'Library' ? '09:00' : '08:00', closingTime: type === 'Café' ? '23:00' : '21:00',
    createdAt: new Date(Date.UTC(2026, 8, 1 + Math.floor((number - 1) / 6))).toISOString(),
    source: 'sample',
  };
}));
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/spaces.json', import.meta.url), JSON.stringify(spaces, null, 2) + '\n');
console.log(`Generated ${spaces.length} fictional study spaces.`);
