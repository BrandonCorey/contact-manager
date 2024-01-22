export default class View {
  constructor(contacts, currentUser) {
    if (currentUser) {
      this.displayMainUI(contacts);
    } else {
      this.displayLogin();
    }
  }

  displayMainUI(contacts) {
    this.renderToolBar();
    this.renderContacts(contacts);
  }

  displayLogin(message) {
    this.renderLogin(message);
  }

  displayError(errorInputs) {
    const inputs = document.querySelectorAll("form input");

    inputs.forEach((input) => {
      const errorMessage = input.closest("span") || input.nextElementSibling;
      errorMessage.classList.toggle("hide", !errorInputs.includes(input));
      input.classList.toggle("invalid-border", errorInputs.includes(input));
    });
  }

  filterContactsByTags(currentTagFilters) {
    const contacts = document.querySelectorAll(".contact");

    contacts.forEach((contact) => {
      const contactTags = Array.from(contact.querySelectorAll(".tag")).map(
        (tag) => tag.id,
      );
      const isVisible =
        currentTagFilters.every((tag) => contactTags.includes(tag)) &&
        this.isSearchedFor(contact);
      contact.classList.toggle("hide", !isVisible);
    });
  }

  getTags(contacts) {
    let tags = contacts.reduce((arr, contact) => arr.concat(contact.tags), []);
    return tags.filter((tag, idx) => tags.indexOf(tag) === idx);
  }

  hideAddContact() {
    document.querySelector("#add-contact").remove();
  }

  hideContact(contact, condition) {
    if (condition) contact.classList.add("hide");
    else contact.classList.remove("hide");
  }

  hideMainUI() {
    Array.from(document.querySelectorAll("#tool-bar, .contacts")).forEach(
      (component) => {
        component.remove();
      },
    );
  }

  highlightCurrentTags(currentContact) {
    const tags = document.querySelectorAll(".tags-section li");
    Array.from(tags).forEach((tag) => {
      if (currentContact.tags.includes(tag.id)) {
        tag.classList.add("selected-tag");
      }
    });
  }

  isSearchedFor(contact) {
    let search = document.querySelector("#search").value;
    return contact.dataset.full_name
      .toLowerCase()
      .startsWith(search.toLowerCase());
  }

  renderLogin(message = "Log in") {
    const login = document.querySelector("#login-template").innerHTML;
    const destination = document.querySelector("main");
    const loginPreComp = Handlebars.compile(login);

    const loginComp = loginPreComp({ message: message });
    destination.insertAdjacentHTML("beforeend", loginComp);
  }

  hideLogin() {
    document.querySelector("#login").remove();
  }

  renderAddContact(contacts, currentContact) {
    const addContact = document.querySelector(
      "#add-contact-template",
    ).innerHTML;
    const destination = document.querySelector("main");
    const addContactPreComp = Handlebars.compile(addContact);
    let allTags = this.getTags(contacts);

    let contactCopy = JSON.parse(JSON.stringify(currentContact));

    contactCopy.tags = allTags;

    const addContactComp = addContactPreComp(contactCopy);
    destination.insertAdjacentHTML("beforeend", addContactComp);

    this.highlightCurrentTags(currentContact);
  }

  renderAddTag(tagName) {
    let tag = document.createElement("li");
    let button = document.createElement("button");
    this.toggleTagColor(tag, true);
    tag.id = tagName;
    tag.textContent = tagName;
    tag.classList.add("tag");

    tag.appendChild(button);
    document.querySelector(".tags-section").appendChild(tag);
  }

  async renderContacts(contactsData) {
    const contacts = document.querySelector(".contacts");

    if (contacts) contacts.remove();

    const contactsHTML = document.querySelector("#contacts-template").innerHTML;
    const destination = document.querySelector("#tool-bar");
    const contactsPreComp = Handlebars.compile(contactsHTML);
    const contactsComp = contactsPreComp({ contacts: contactsData });

    destination.insertAdjacentHTML("afterend", contactsComp);
    return true;
  }

  renderToolBar() {
    const toolBar = document.querySelector("#tool-bar-template").innerHTML;
    const destination = document.querySelector("main");
    destination.insertAdjacentHTML("afterbegin", toolBar);
  }

  toggleTagColor(tag, condition) {
    tag.classList.toggle("selected-tag", condition);
  }

  updateTagColors(currentTagFilters) {
    const allTags = document.querySelectorAll(".contacts .tag");

    allTags.forEach((tag) => {
      const tagId = tag.id;
      const isActive = currentTagFilters.includes(tagId);
      this.toggleTagColor(tag, isActive);
    });
  }
}
