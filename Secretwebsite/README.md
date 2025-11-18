# Secret Website

This project is a web application that allows users to authenticate and access a dashboard, as well as provides an admin console for managing user accounts.

## Project Structure

```
Secretwebsite
├── public
│   ├── index.html         # Login form for user authentication
│   ├── dashboard.html     # User dashboard after successful login
│   ├── admin.html         # Admin console for managing user accounts
│   ├── style.css          # Styles for the main website
│   ├── admin.css          # Styles specific to the admin console
│   └── scripts
│       ├── main.js        # Main JavaScript logic for user login
│       ├── admin.js       # JavaScript logic for the admin console
│       └── firebase-config.js # Firebase configuration and initialization
├── functions
│   ├── index.js           # Server-side functions for managing user accounts
│   └── package.json       # Configuration for Firebase functions
├── firebase.json          # Configuration settings for Firebase hosting and functions
├── .firebaserc            # Firebase project settings for deployment
├── package.json           # Configuration for npm dependencies and scripts
└── README.md              # Documentation for the project
```

## Features

- **User Authentication**: Users can log in using their email and password.
- **User Dashboard**: After logging in, users are redirected to a dashboard displaying their information.
- **Admin Console**: Administrators can manage user accounts, including creating and deleting users.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd Secretwebsite
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set up Firebase:
   - Create a Firebase project and configure authentication.
   - Update the Firebase configuration in `public/scripts/firebase-config.js`.

5. Deploy the functions:
   ```
   cd functions
   firebase deploy --only functions
   ```

6. Start the application:
   ```
   firebase serve
   ```

## Usage Guidelines

- Access the login page at `http://localhost:5000` (or the appropriate URL).
- Use the admin console at `http://localhost:5000/admin.html` for managing user accounts.
- Ensure that you have the necessary permissions to access the admin console.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.