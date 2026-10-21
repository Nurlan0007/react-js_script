import { CATEGORIES, DIFFICULTIES, STATUSES } from './settings.js';

export function validateQuest(values) {
  const errors = {};
  for (const [key, label, min, max] of [
    ['name', 'Quest name', 3, 80], ['description', 'Description', 20, 1200],
    ['location', 'Location', 2, 100], ['questGiver', 'Quest giver', 2, 80], ['objectives', 'Objectives', 10, 600],
  ]) {
    if (typeof values[key] !== 'string' || values[key].trim().length < min || values[key].trim().length > max) errors[key] = `${label} must contain ${min}–${max} characters.`;
  }
  for (const [key, label, min, max] of [['reward', 'Reward', 0, 100000], ['duration', 'Duration', 5, 1440], ['minLevel', 'Minimum level', 1, 100]]) {
    const number = Number(values[key]);
    if (values[key] === '' || values[key] == null || !Number.isInteger(number) || number < min || number > max) errors[key] = `${label} must be a whole number from ${min} to ${max}.`;
  }
  if (!CATEGORIES.includes(values.category)) errors.category = 'Choose a valid category.';
  if (!DIFFICULTIES.includes(values.difficulty)) errors.difficulty = 'Choose a valid difficulty.';
  if (!STATUSES.includes(values.status)) errors.status = 'Choose a valid status.';
  return errors;
}

export function normalizeQuest(values) {
  return {
    name: values.name.trim(), description: values.description.trim(), location: values.location.trim(),
    questGiver: values.questGiver.trim(), objectives: values.objectives.trim(), category: values.category,
    difficulty: values.difficulty, status: values.status, reward: Number(values.reward),
    duration: Number(values.duration), minLevel: Number(values.minLevel),
  };
}
