export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Same keys as the original single-file version, so existing saved data keeps working.
export const STORAGE_KEYS = {
  tasks: 'weekplan_tasks',
  schedule: 'weekplan_schedule',
  settings: 'weekplan_settings',
};

// Defaults for the customizable categories (max 4, see settings.js).
export const CATEGORIES = [
  { id: 'Work', label: 'Work / Study', color: '#FFE600' },
  { id: 'Health', label: 'Health / Fitness', color: '#00F58A' },
  { id: 'Personal', label: 'Personal / Life', color: '#3B82F6' },
  { id: 'Leisure', label: 'Leisure / Break', color: '#FF6BD6' },
];

export const SWATCHES = ['#FFE600', '#00F58A', '#3B82F6', '#FF6BD6', '#FF8A3D', '#B794F6'];

export const DEFAULT_TASKS = [
  { id: 't1', title: 'Deep Work / Coding', category: 'Work', color: '#FFE600' },
  { id: 't2', title: 'Gym Workout', category: 'Health', color: '#00F58A' },
  { id: 't3', title: 'Team Sync / Meeting', category: 'Work', color: '#3B82F6' },
  { id: 't4', title: 'Reading & Relaxation', category: 'Leisure', color: '#FF6BD6' },
  { id: 't5', title: 'Meal Prep', category: 'Personal', color: '#FF8A3D' },
];
