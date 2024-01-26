import Model from "./mvc-modules/model.js";
import View from "./mvc-modules/view.js";
import Controller from "./mvc-modules/controller.js";

(() => {
  class App {
    init() {
      document.addEventListener("DOMContentLoaded", async () => {
        const model = new Model();
        let contacts;
        let loggedIn = model.isLoggedIn();

        if (loggedIn) {
          contacts = await model.fetchContacts();
        }
        const view = new View(contacts, loggedIn);
        new Controller(model, view);
      });
    }
  }

  const app = new App();
  app.init();
})();
