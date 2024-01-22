export default class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.bind();
  }

  bind() {
    document.addEventListener("click", this.handleContactActions.bind(this));
    document.addEventListener("submit", this.handleSubmitContact.bind(this));
    document.addEventListener("submit", this.handleLogin.bind(this));
    document.addEventListener("keyup", this.handleSearch.bind(this));
    document.addEventListener("click", this.handleTagActions.bind(this));
    document.addEventListener("keydown", this.handleAddTag.bind(this));
  }

  // Aggregated handlers
  handleContactActions(event) {
    const actions = ["add", "delete", "edit", "cancel"];
    if (this.model.currentUser === "" && actions.includes(event.target.id)) {
      this.handleNotLoggedIn(event);
    } else if (event.target.id === "add") this.handleAddContact(event);
    else if (event.target.id === "delete") this.handleDeleteContact(event);
    else if (event.target.id === "edit") this.handleEditContact(event);
    else if (event.target.id === "cancel") this.handleCancelContact(event);
  }

  handleNotLoggedIn(event) {
    event.preventDefault();
    this.view.hideMainUI();
    this.view.displayLogin();
  }

  handleTagActions(event) {
    if (event.target.closest(".tag") && event.target.closest(".contact")) {
      this.handleFilterTags(event);
    } else if (
      event.target.closest(".tag") &&
      !event.target.closest(".contact")
    ) {
      this.handleToggleTag(event);
    }
  }

  // Other handlers
  handleAddContact(event) {
    event.preventDefault();
    this.view.hideMainUI();
    this.view.renderAddContact(
      this.model.getContacts(),
      this.model.getCurrentContact(),
    );
  }

  handleAddTag(event) {
    if (event.target.id !== "tags") return;

    let tagName = event.target.value;
    let currentContact = this.model.getCurrentContact();

    if (event.key === "Enter") {
      event.preventDefault();
      let isValidTagName =
        !currentContact.tags.includes(tagName) && tagName.length > 0;
      if (isValidTagName) {
        this.model.addTagToContact(tagName, isValidTagName);
        this.view.renderAddTag(tagName);
        event.target.value = "";
      }
    }
  }

  async handleCancelContact(event) {
    event.preventDefault();
    this.view.hideAddContact();

    try {
      let contacts = await this.model.fetchContacts();
      if (!contacts) throw new Error(`Contact could not be deleted`);

      this.model.resetCurrentContact();
      this.view.displayMainUI(contacts);
    } catch (error) {
      console.log(error.message);
    }
  }

  async handleDeleteContact(event) {
    event.preventDefault();

    let answer = window.confirm("Are you sure you want to delete this user?");
    if (!answer) return;
    let contactId = event.target.closest(".contact").dataset.id;
    try {
      let deleted = await this.model.deleteContact(contactId);
      let contacts = await this.model.fetchContacts();

      if (!deleted) {
        throw new Error(`Contact could not be deleted`);
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

    let contactId = event.target.closest(".contact").dataset.id;
    this.view.hideMainUI();

    let currentContact = await this.model.fetchContact(contactId);

    this.view.renderAddContact(this.model.getContacts(), currentContact);
  }

  handleFilterTags(event) {
    const tag = event.target.closest(".tag");
    if (!tag || !event.target.closest(".contact")) return;

    this.model.addTagFilter(tag);

    let currentTagFilters = this.model.getCurrentTagFilters();
    this.view.updateTagColors(currentTagFilters);
    this.view.filterContactsByTags(currentTagFilters);
  }

  invalidInputs(event) {
    const form = event.target;
    const inputs = Array.from(form.querySelectorAll("input"));
    const tags = Array.from(form.querySelectorAll(".selected-tag"));

    if (tags.length > 0) this.removeTagValidation(inputs);

    let invalids = Array.from(inputs).filter(
      (input) => input.value.length === 0,
    );
    return invalids;
  }

  handleSearch(event) {
    if (event.target.id !== "search") return;

    let contacts = document.querySelectorAll(".contact");
    Array.from(contacts).forEach((contact) => {
      let validName = this.view.isSearchedFor(contact);
      this.view.hideContact(contact, !validName);
    });
  }

  async handleLogin(event) {
    event.preventDefault();

    if (this.model.isLoggedIn()) return;

    const form = event.target;
    if (form.getAttribute("action") !== "/api/login") return;

    const invalid = this.invalidInputs(event);
    if (invalid.length > 0) {
      this.view.displayError(invalid);
      return;
    }
    const formData = new FormData(form);
    const reqBody = new URLSearchParams(formData).toString();

    try {
      await this.model.login(reqBody);

      if (!this.model.isLoggedIn()) {
        this.view.hideLogin();
        this.view.displayLogin("Could not authenticate user...");
      } else {
        let contacts = await this.model.fetchContacts();
        this.view.hideLogin();
        this.view.displayMainUI(contacts);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleSubmitContact(event) {
    event.preventDefault();

    const form = event.target;
    if (form.getAttribute("action") !== "/api/contacts") return;

    if (this.model.currentUser === "") {
      this.handleNotLoggedIn(event);
      return;
    }

    const invalid = this.invalidInputs(event);
    if (invalid.length > 0) {
      this.view.displayError(invalid);
      return;
    }

    const currentContact = this.model.getCurrentContact();
    const formData = new FormData(form);
    formData.set("tags", currentContact.tags.join(","));

    const reqBody = new URLSearchParams(formData).toString();

    try {
      let submitted = await this.model.submitContact(reqBody);
      let contacts = await this.model.fetchContacts();

      if (!submitted) {
        throw new Error(`Contact could not be saved`);
      } else {
        this.view.hideAddContact();
        this.view.displayMainUI(contacts);
        this.model.resetCurrentContact();
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  handleToggleTag(event) {
    let tag = event.target.closest(".tag");
    let currentContact = this.model.getCurrentContact();

    if (!tag || !currentContact) return;

    event.preventDefault();

    if (event.pointerId === -1) return;
    let addTag = !currentContact.tags.includes(tag.id);

    if (addTag) this.model.addTagToContact(tag.id);
    else this.model.removeTagFromContact(tag.id);
    this.view.toggleTagColor(tag, addTag);
  }

  removeTagValidation(inputs) {
    const form = document.querySelector("form");
    inputs.splice(inputs.indexOf(form.querySelector("#tags")));
  }
}
