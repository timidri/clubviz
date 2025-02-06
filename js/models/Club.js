export class Club {
  constructor(id) {
    this.id = id;
    this.members = new Set();
    this.traitCounts = new Map();
    this.x = 0;
    this.y = 0;
  }

  isMember(person) {
    return this.members.has(person);
  }

  addMember(person) {
    if (!this.isMember(person)) {
      this.members.add(person);
      person.joinClub(this);
      this.updateTraitCount(person.trait, 1);
    }
  }

  removeMember(person) {
    if (this.members.delete(person)) {
      this.updateTraitCount(person.trait, -1);
    }
  }

  updateTraitCount(trait, delta) {
    const currentCount = this.traitCounts.get(trait) || 0;
    const newCount = currentCount + delta;
    if (newCount > 0) {
      this.traitCounts.set(trait, newCount);
    } else {
      this.traitCounts.delete(trait);
    }
  }

  getMemberCount() {
    return this.members.size;
  }

  getTraitCount(trait) {
    return this.traitCounts.get(trait) || 0;
  }
}
