export const DATA_KEY = 'questboard-task4:v1';

export const NETWORK_MODES = {
  standard: { label: 'Standard', minDelay: 400, maxDelay: 1500, errorChance: 0.05, description: 'Random 0.4–1.5s delay · 5% error chance' },
  slow: { label: 'Slow connection', minDelay: 1800, maxDelay: 3500, errorChance: 0.05, description: 'Random 1.8–3.5s delay · 5% error chance' },
  reliable: { label: 'Reliable connection', minDelay: 150, maxDelay: 350, errorChance: 0, description: 'Random 0.15–0.35s delay · No random errors' },
  race: { label: 'Out-of-order demo', minDelay: 250, maxDelay: 1800, errorChance: 0, description: 'Odd-ID details: 1.8s · Even-ID details: 0.25s · Changes: 1.4s' },
  offline: { label: 'Offline demo', minDelay: 500, maxDelay: 800, errorChance: 1, description: 'Every request fails until you change the connection' },
};

export const CATEGORIES = ['Exploration', 'Combat', 'Support', 'Puzzle'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Epic'];
export const STATUSES = ['Planned', 'Active', 'Completed'];
