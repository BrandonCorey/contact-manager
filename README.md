# Contact Manager
### This is a fullstack app built with Node, Express, and HandleBars
- While there is a node server with a RESTful API, the main focus of this project was frontend DOM manipulation
- I used the MVC pattern to modularize my code and separate concerns of state management, rendering, and event handling
- There are **no frontend frameworks used here**, only HandleBarsJS and vanilla JS

## Functionality
You can perform CRUD operations via the API endpoints set up within the Node server
- You can view the API reference at `localhost:XXXX/doc`

### Operations include:
- View contact(s)
- Create a contact
- Edit a contact
  - Name
  - Email
  - Phone number
  - Tags for contact
    - Create a tag
    - Delete a tag
- Delete a contact
- Filter contacts by search
- Filter contacts by tag (clicking on tag)
 
**To get started**
```
npm install
```

Because there is currently no dedicated database, you do not need to configure one
- This is for demo purposes

### Preview
![image](https://github.com/BrandonCorey/contact-manager/assets/93304067/0f48aebb-83e1-4040-86e5-a5d6ae46732d)