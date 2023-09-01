(() => {

  class Controller {
    constructor(model, view) {
      this.model = model;
      this.view = view;
      this.bind();
    }

    bind() {
      document.addEventListener('click', this.handleContactActions.bind(this));
      document.addEventListener('submit', this.handleSubmission.bind(this));
      document.addEventListener('keyup', this.handleSearch.bind(this));
      document.addEventListener('click', this.handleTagActions.bind(this));
      document.addEventListener('keydown', this.handleAddTag.bind(this));
    }

    // Aggregated handlers
    handleContactActions(event) {
      if (event.target.id === 'add') this.handleAddContact(event);
      else if (event.target.id === 'delete') this.handleDeleteContact(event);
      else if (event.target.id === 'edit') this.handleEditContact(event);
      else if (event.target.id === 'cancel') this.handleCancelContact(event);
    }

    handleTagActions(event) {
      if (event.target.closest('.tag') && event.target.closest('.contact')) this.handleFilterTags(event);
      else if (event.target.closest('.tag') && !event.target.closest('.contact')) this.handleToggleTag(event);
    }

    // Other handlers
    handleAddContact(event) {
      event.preventDefault();
      this.view.hideMainUI();
      this.view.renderAddContact(this.model.getContacts(), this.model.getCurrentContact());
    }

    handleAddTag(event) {
      if (event.target.id !== 'tags') return;

      let tagName = event.target.value;
      let currentContact = this.model.getCurrentContact();

      if (event.key === 'Enter') {
        event.preventDefault();
        currentContact.tags.push(tagName);

        this.view.renderAddTag(tagName);
        event.target.value = '';
      }
    }

    async handleCancelContact(event) {
      event.preventDefault();
      this.view.hideAddContact();

      try {
        let contacts = await this.model.fetchContacts();
        if (!contacts) throw new Error(`Contact could not be deleted: REASON --> ${error.message}`);

        this.model.resetCurrentContact();
        this.view.displayMainUI(contacts);
      } catch (error) {
        console.log(error.message);
      }
    }

    async handleDeleteContact(event) {

      event.preventDefault();

      let answer = window.confirm('Are you sure you want to delete this user?');
      if (!answer) return;
      let contactId = event.target.closest('.contact').dataset.id;
      try {
        let deleted = await this.model.deleteContact(contactId);
        let contacts = await this.model.fetchContacts();

        if (!deleted) {
          throw new Error(`Contact could not be deleted: REASON --> ${error.message}`);
        } else {
          this.view.hideMainUI();
          this.view.displayMainUI(contacts);
        }
      } catch (error) {
        console.log(error.message);
      }
    }

    async handleEditContact(event) {
      event.preventDefault();

      let contactId = event.target.closest('.contact').dataset.id;
      this.view.hideMainUI();

      let currentContact = await this.model.fetchContact(contactId);

      this.view.renderAddContact(this.model.getContacts(), currentContact);
    }

    handleFilterTags(event) {
      const tag = event.target.closest('.tag');
      if (!tag || !event.target.closest('.contact')) return;

      this.model.addTagFilter(tag);

      let currentTagFilters = this.model.getCurrentTagFilters();
      this.view.updateTagColors(currentTagFilters);
      this.view.filterContactsByTags(currentTagFilters);
    }

    invalidInputs(event) {
      const form = event.target;
      const inputs = Array.from(form.querySelectorAll('form input'));
      const tags = Array.from(form.querySelectorAll('.selected-tag'));

      if (tags.length > 0) this.removeTagValidation(inputs);

      let invalids = Array.from(inputs).filter(input => input.value.length === 0);
      return invalids;
    }

    handleSearch(event) {
      if (event.target.id !== 'search') return;

      let contacts = document.querySelectorAll('.contact');
      Array.from(contacts).forEach(contact => {
        let validName = this.view.isSearchedFor(contact);
        this.view.hideContact(contact, !validName);
      });
    }

    async handleSubmission(event) {
      event.preventDefault();

      const invalid = this.invalidInputs(event);
      if (invalid.length > 0) {
        this.view.displayError(invalid);
        return;
      };

      const currentContact = this.model.getCurrentContact();
      const formData = new FormData(document.querySelector('form'));
      formData.set('tags', currentContact.tags.join(','));

      const qs = new URLSearchParams(formData).toString();

      try {
        let submitted = this.model.submitContact(qs);
        let contacts = await this.model.fetchContacts();

        if (!submitted) {
          throw new Error(`Contact could not be saved: REASON --> ${error.message}`);
        } else {
          this.view.hideAddContact();
          this.view.displayMainUI(contacts);
          this.model.resetCurrentContact();
        }
      } catch (error) {
        console.log(error.message);
      }
    }

    removeTagValidation(inputs) {
      const form = document.querySelector('form');
      inputs.splice(inputs.indexOf(form.querySelector('#tags')));
    }

    handleToggleTag(event) {
      let tag = event.target.closest('.tag');
      let currentContact = this.model.getCurrentContact();

      if (!tag || !currentContact) return;

      event.preventDefault();

      if (event.pointerId === -1) return;
      let added = this.model.addTagToContact(tag, currentContact.tags.includes(tag.id))

      this.view.toggleTagColor(tag, added);
    }
  }

  class Model {
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

    addTagToContact(tag, condition) {
      if (!condition) {
        this.currentContact.tags.push(tag.id);
        return true;
      } else {
        this.currentContact.tags.splice(this.currentContact.tags.indexOf(tag.id), 1);
        return false;
      }
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

  class View {
    constructor(contacts) {
      this.displayMainUI(contacts);
    }

    displayMainUI(contacts) {
      this.renderToolBar();
      this.renderContacts(contacts);
    }

    displayError(errorInputs) {
      const inputs = document.querySelectorAll('form input');

      inputs.forEach(input => {
        const errorMessage = input.closest('span') || input.nextElementSibling;
        errorMessage.classList.toggle('hide', !errorInputs.includes(input));
        input.classList.toggle('invalid-border', errorInputs.includes(input));
      });
    }

    filterContactsByTags(currentTagFilters) {
      const contacts = document.querySelectorAll('.contact');

      contacts.forEach(contact => {
        const contactTags = Array.from(contact.querySelectorAll('.tag')).map(tag => tag.id);
        const isVisible = currentTagFilters.every(tag => contactTags.includes(tag)) && this.isSearchedFor(contact);
        contact.classList.toggle('hide', !isVisible);
      });
    }

    getTags(contacts) {
      let tags = contacts.reduce((arr, contact) => arr.concat(contact.tags), []);
      return tags.filter((tag, idx) => tags.indexOf(tag) === idx);
    }

    hideAddContact() {
      document.querySelector('#add-contact').remove();
    }

    hideContact(contact, condition) {
      if (condition) contact.classList.add('hide');
      else contact.classList.remove('hide');
    }

    hideMainUI() {
      Array.from(document.querySelectorAll('#tool-bar, .contacts'))
        .forEach(component => {
          component.remove();
        });
    }

    highlightCurrentTags(currentContact) {
      const tags = document.querySelectorAll('.tags-section li');
      Array.from(tags).forEach(tag => {
        if (currentContact.tags.includes(tag.id)) {
          tag.classList.add('selected-tag');
        }
      });
    }

    isSearchedFor(contact) {
      let search = document.querySelector('#search').value;
      return contact.dataset.full_name.toLowerCase().startsWith(search.toLowerCase());
    }

    renderAddContact(contacts, currentContact) {
      const addContact = document.querySelector('#add-contact-template').innerHTML;
      const destination = document.querySelector('main');
      const addContactPreComp = Handlebars.compile(addContact);
      let allTags = this.getTags(contacts);

      let contactCopy = JSON.parse(JSON.stringify(currentContact));

      contactCopy.tags = allTags;

      const addContactComp = addContactPreComp(contactCopy)
      destination.insertAdjacentHTML('beforeend', addContactComp);

      this.highlightCurrentTags(currentContact);
    }


    renderAddTag(tagName) {
      let tag = document.createElement('li');
      let button = document.createElement('button');
      this.toggleTagColor(tag, true);
      tag.id = tagName;
      tag.textContent = tagName;
      tag.classList.add('tag');

      tag.appendChild(button);

      document.querySelector('.tags-section').appendChild(tag);
    }

    async renderContacts(contactsData) {
      const contacts = document.querySelector('.contacts');

      if (contacts) contacts.remove();

      const contactsHTML = document.querySelector('#contacts-template').innerHTML;
      const destination = document.querySelector('#tool-bar');
      const contactsPreComp = Handlebars.compile(contactsHTML);
      const contactsComp = contactsPreComp({ contacts: contactsData });

      destination.insertAdjacentHTML('afterend', contactsComp);
      return true;
    }

    renderToolBar() {
      const toolBar = document.querySelector('#tool-bar-template').innerHTML;
      const destination = document.querySelector('main');
      destination.insertAdjacentHTML('afterbegin', toolBar);
    }

    toggleTagColor(tag, condition) {
      tag.classList.toggle('selected-tag', condition);
    }

    updateTagColors(currentTagFilters) {
      const allTags = document.querySelectorAll('.contacts .tag');

      allTags.forEach(tag => {
        const tagId = tag.id;
        const isActive = currentTagFilters.includes(tagId);
        this.toggleTagColor(tag, isActive);
      });
    }
  }

  class App {
    init() {
      document.addEventListener('DOMContentLoaded', async () => {
        const model = new Model();
        await model.fetchContacts();
        const view = new View(model.getContacts());
        new Controller(model, view);
      });
    }
  }

  const app = new App();
  app.init()

})();