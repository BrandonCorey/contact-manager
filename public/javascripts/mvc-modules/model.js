export default class Model {
  constructor() {
    this.contacts = [];
    this.resetCurrentContact();
    this.currentTagFilters = [];
  }

  addTagFilter(tag) {
    const tagId = tag.id;
    const index = this.currentTagFilters.indexOf(tagId);

    if (index === -1) this.currentTagFilters.push(tagId);
    else this.currentTagFilters.splice(index, 1);
  }

  addTagToContact(tagName) {
    this.currentContact.tags.push(tagName);
  }

  async deleteContact(contactId) {
    return fetch(`/api/contacts/${contactId}`, { method: 'DELETE' })
      .then(res => res.ok ? true : false)
      .catch(error => error);
  }

  async fetchContact(contactId) {
    return fetch(`/api/contacts/${contactId}`, { method: 'GET' })
      .then(res => res.json())
      .then(contact => this.currentContact = this.processContacts([contact])[0])
      .catch((error) => new Error(`Contact could not be fetched: REASON --> ${error.message}`));
  }

  async fetchContacts() {
    return fetch('/api/contacts', { method: 'GET' })
      .then(res => res.json())
      .then(contacts => this.contacts = this.processContacts(contacts))
      .catch((error) => new Error(`Contacts could not be fetched: REASON --> ${error.message}`));
  }

  getContacts() {
    return this.contacts;
  }

  getCurrentContact() {
    return this.currentContact;
  }

  getCurrentTagFilters() {
    return this.currentTagFilters;
  }

  processContacts(contacts) {
    return Array.from(contacts).map(contact => {
      return {
        id: contact.id,
        full_name: contact.full_name,
        email: contact.email,
        phone_number: contact.phone_number,
        tags: contact.tags.split(',')
      }
    });
  }

  removeTagFromContact(tagName) {
    this.currentContact.tags.splice(this.currentContact.tags.indexOf(tagName), 1);
  }

  resetCurrentContact() {
    this.currentContact = { tags: [] }
  }

  async submitContact(qs) {
    let path;
    let method;

    if (this.currentContact.id) {
      path = `/api/contacts/${this.currentContact.id}`;
      method = 'PUT'
    } else {
      path = '/api/contacts';
      method = 'POST';
    }

    return fetch(path, {
      method,
      body: qs,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }).catch(res => res.ok ? true : false)
      .then(error => error);
  }
}