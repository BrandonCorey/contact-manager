(() => {
  class ContactManager {
    constructor() {
      this.contacts = [];
      this.resetCurrentContact();
      this.currentTagFilters = [];
      this.displayMainUI();
      this.bind();
    }
  
    // Controller
    bind() {
      document.querySelector('main').addEventListener('click', this.handleAddContact.bind(this));
      document.querySelector('main').addEventListener('click', this.handleCancel.bind(this));
      document.addEventListener('submit', this.handleSubmission.bind(this));
      document.addEventListener('click', this.handleDelete.bind(this));
      document.addEventListener('click', this.handleEdit.bind(this));
      document.addEventListener('keyup', this.handleSearch.bind(this));
      document.addEventListener('click', this.handleToggleTag.bind(this));
      document.addEventListener('keydown', this.handleAddTag.bind(this));
      document.addEventListener('click', this.handleFilterTags.bind(this))
    }

    async handleDelete(event) {
      if (event.target.id !== 'delete') return;
      event.preventDefault();
  
      let answer = window.confirm('Are you sure you want to delete this user?');
      if (!answer) return;
  
      let contactId = event.target.closest('.contact').dataset.id;
      this.deleteContact(contactId);
    }
  
    async handleEdit(event) {
      if (event.target.id !== 'edit') return;
      event.preventDefault();
  
      let contactId = event.target.closest('.contact').dataset.id;
      this.hideMainUI();
  
      this.currentContact = this.processContacts([await this.fetchContact(contactId)])[0];
      this.renderAddContact();
    }
  
    handleAddContact(event) {
      if (event.target.id === 'add') {
        event.preventDefault();
  
        this.hideMainUI();
        this.renderAddContact();
      }
    }
  
    handleCancel(event) {
      if (event.target.id === 'cancel') {
        event.preventDefault();
        this.hideAddContact();
        this.displayMainUI();
      }
    }
  
    handleSubmission(event) {
      event.preventDefault();
  
      const invalid = this.invalidInputs(event);
       if (invalid.length > 0) {
        this.displayError(invalid);
        return;
       };

      const formData = new FormData(document.querySelector('form'));
      formData.set('tags', this.currentContact.tags.join(','));
  
      const qs = new URLSearchParams(formData).toString();
  
      this.submitContact(qs);
    }
  
    handleToggleTag(event) {
      let tag = event.target.closest('.tag');

      if (!tag || !this.currentContact) return;

      event.preventDefault();

      if (event.pointerId === -1) return;
      let added = this.addTagToContact(tag, this.currentContact.tags.includes(tag.id))

      this.toggleTagColor(tag, added);
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

    handleAddTag(event) {
      if (event.target.id !== 'tags') return;
      let tagName = event.target.value;

      if (event.key === 'Enter') {
        this.currentContact.tags.push(tagName);
        this.renderAddTag(tagName);
        event.target.value = '';
      }
    }

    handleSearch(event) {
      if (event.target.id !== 'search') return;

      let contacts = document.querySelectorAll('.contact');
      Array.from(contacts).forEach(contact => {
        let validName = this.isSearchedFor(contact);
        this.hideContact(contact, !validName);
      })
    }

    handleFilterTags(event) {
      const tag = event.target.closest('.tag');

      if (!tag || !event.target.closest('.contact')) return;

      this.addTagFilter(tag);
      this.updateTagColors();
      this.filterContactsByTags();
    }
    // Model

    async fetchContacts() {
      return fetch('/api/contacts', { method: 'GET'})
              .then(res => res.json())
              .then(contacts => { 
                this.contacts = this.processContacts(contacts);
              })
              .catch(error => new Error(error.message));
    }
  
    async fetchContact(contactId) { 
      return fetch(`/api/contacts/${contactId}`, { method: 'GET' })
               .then(res => res.json())
               .then(contact => contact)
               .catch(error => new Error(error));
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
  
      fetch(path, {
        method,
        body: qs,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      }).then(res => res.ok ? console.log('Saved!') : console.log('Failed'))
        .then(_ => {
          this.hideAddContact();
          this.displayMainUI();
        })
        .then(_ => this.resetCurrentContact())
        .catch(err => new Error(err.message));
    }

    async deleteContact(contactId) {
      fetch(`/api/contacts/${contactId}`, { method: 'DELETE' })
        .then(res => res.ok ? console.log('Deleted!') : console.log('Could not delete.'))
        .then(_ => {
          this.hideMainUI();
          this.displayMainUI()
        })
        .catch(error => new Error(error.message));
    }

    getTags() {
      let tags = this.contacts.reduce((arr, contact) => arr.concat(contact.tags), []);
      return tags.filter((tag, idx) => tags.indexOf(tag) === idx);
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
      this.currentContact = {tags: []}
    }

    addTagFilter(tag) {
      const tagId = tag.id;
      const index = this.currentTagFilters.indexOf(tagId);

      if (index === -1) this.currentTagFilters.push(tagId);
      else this.currentTagFilters.splice(index, 1);
    }

    // View
  
    renderToolBar() {
      const toolBar = document.querySelector('#tool-bar-template').innerHTML;
      const destination = document.querySelector('main');
      destination.insertAdjacentHTML('afterbegin', toolBar);
    }
  
    async renderContacts() {
      await this.fetchContacts();
      const contacts =  document.querySelector('.contacts');
  
      if (contacts) contacts.remove();
  
      const contactsHTML = document.querySelector('#contacts-template').innerHTML;
      const destination = document.querySelector('#tool-bar');
      const contactsPreComp = Handlebars.compile(contactsHTML);
      const contactsComp = contactsPreComp({ contacts: this.contacts });
      this.searchContacts = null;
    
      destination.insertAdjacentHTML('afterend', contactsComp);
      return true;
    }
  
    renderAddContact() {
      const addContact = document.querySelector('#add-contact-template').innerHTML;
      const destination = document.querySelector('main');
      const addContactPreComp = Handlebars.compile(addContact);
      let allTags = this.getTags();

      let contactCopy = JSON.parse(JSON.stringify(this.currentContact));

      contactCopy.tags = allTags;

      const addContactComp = addContactPreComp(contactCopy)
      destination.insertAdjacentHTML('beforeend', addContactComp);

      this.highlightCurrentTags();
    }

    highlightCurrentTags() {
      const tags = document.querySelectorAll('.tags-section li');
 
      Array.from(tags).forEach(tag => {
        if (this.currentContact.tags.includes(tag.id)) {
          tag.classList.add('selected-tag');
        }
      });
    }

    renderAddTag(tagName) {
      let tag = document.createElement('li');
      let button = document.createElement('button');
      this.toggleTagColor(tag, true);
      tag.id = tagName;
      tag.textContent = tagName;
      tag.appendChild(button);

      document.querySelector('.tags-section').appendChild(tag);
    }

    toggleTagColor(tag, condition) {
      tag.classList.toggle('selected-tag', condition);
    }

    updateTagColors() {
      const allTags = document.querySelectorAll('.contacts .tag');

      allTags.forEach(tag => {
        const tagId = tag.id;
        const isActive = this.currentTagFilters.includes(tagId);
        this.toggleTagColor(tag, isActive);
      });
    }

    filterContactsByTags() {
      const contacts = document.querySelectorAll('.contact');

      contacts.forEach(contact => {
        const contactTags = Array.from(contact.querySelectorAll('.tag')).map(tag => tag.id);
        const isVisible = this.currentTagFilters.every(tag => contactTags.includes(tag)) && this.isSearchedFor(contact);
        contact.classList.toggle('hide', !isVisible);
      });
    }

    isSearchedFor(contact) {
      let search = document.querySelector('#search').value;
      return contact.dataset.full_name.toLowerCase().startsWith(search.toLowerCase());
    }

    hideContact(contact, condition) {
      if (condition) contact.classList.add('hide');
      else contact.classList.remove('hide');
    }
  
    hideAddContact() {
      document.querySelector('#add-contact').remove();
    }
  
    hideMainUI() {
      Array.from(document.querySelectorAll('#tool-bar, .contacts'))
           .forEach(component => {
            component.remove();
           });
    }

    displayMainUI() {
      this.renderToolBar();
      this.renderContacts();
    }
  
    invalidInputs(event) {
      const form = event.target;
      const inputs = Array.from(form.querySelectorAll('form input'));
      const tags = Array.from(form.querySelectorAll('.selected-tag'));
   
      if (tags.length > 0) this.removeTagValidation(inputs);
   
      let invalids = Array.from(inputs).filter(input => input.value.length === 0);
      return invalids;
    }

    removeTagValidation(inputs) {
      const form = document.querySelector('form');
      inputs.splice(inputs.indexOf(form.querySelector('#tags'))); 
    }
  
    displayError(errorInputs) {
      const inputs = document.querySelectorAll('form input');
    
      inputs.forEach(input => {
        const errorMessage = input.closest('span') || input.nextElementSibling;
        errorMessage.classList.toggle('hide', !errorInputs.includes(input));
        input.classList.toggle('invalid-border', errorInputs.includes(input));
      });
    }
  }

  class Controller {
    constructor(model, view) {
      this.model = model;
      this.view = view;
    }

    
  }
  
  
  document.addEventListener('DOMContentLoaded', event => {
    new ContactManager();
  });
})();