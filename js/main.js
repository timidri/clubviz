import { defaultConfig, getCurrentConfig } from './config.js';
import { Person } from './models/Person.js';
import { Club } from './models/Club.js';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('totalPeople').value = defaultConfig.totalPeople;
  document.getElementById('totalClubs').value = defaultConfig.totalClubs;

  // Test button click
  document.getElementById('applyParams').addEventListener('click', () => {
    const config = getCurrentConfig();
    console.log('Current configuration:', config);

    // Create test clubs
    const clubs = Array(config.totalClubs).fill().map((_, i) => new Club(i));

    // Create test people
    const people = [
      new Person(1, 'M'),
      new Person(2, 'F'),
      new Person(3, 'M')
    ];

    console.log('Initial setup:', {
      clubs: clubs.map(c => ({
        id: c.id,
        members: c.getMemberCount(),
        traitCounts: Object.fromEntries(c.traitCounts)
      })),
      people: people.map(p => ({
        id: p.id,
        trait: p.trait,
        clubs: p.clubs.size
      }))
    });

    // Simulate 5 turns
    for (let turn = 1; turn <= 5; turn++) {
      console.log(`\nTurn ${turn}:`);
      people.forEach(person => {
        const result = person.takeTurn(clubs);
        console.log(`Person ${person.id} (${person.trait}):`, {
          action: result.action,
          memberOf: result.memberOf,
          clubDetails: result.clubDetails
        });
      });
    }

  });
});