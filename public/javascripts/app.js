import Model from "./mvc-modules/model.js";
import View from "./mvc-modules/view.js";
import Controller from "./mvc-modules/controller.js";

(() => {
  class App {
    init() {
      document.addEventListener("DOMContentLoaded", async () => {
        const model = new Model();
        const view = new View(model.getContacts(), model.isLoggedIn());
        new Controller(model, view);
      });
    }
  }

  const app = new App();
  app.init();
})();
