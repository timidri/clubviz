import { defaultConfig, getCurrentConfig } from './config.js';
import { Person } from './models/Person.js';
import { Club } from './models/Club.js';
import { Dashboard } from './visualization/Dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new Dashboard();

  document.getElementById('totalPeople').value = defaultConfig.totalPeople;
  document.getElementById('totalClubs').value = defaultConfig.totalClubs;

  document.getElementById('applyParams').addEventListener('click', () => {
    const config = getCurrentConfig();
    console.log('Current configuration:', config);

    // Create test clubs
    const clubs = Array(config.totalClubs).fill().map((_, i) => new Club(i));

    // Create people with random traits
    const people = Array(config.totalPeople).fill().map((_, i) => {
      const trait = Math.random() < 0.5 ? 'M' : 'F';
      return new Person(i, trait);
    });

    // Initialize dashboard with clubs and people
    dashboard.initialize(clubs, people);
  });
});