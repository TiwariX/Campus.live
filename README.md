# CampusFind — TiwariX Web Solutions

A responsive college Lost & Found portal built with HTML, CSS and vanilla JavaScript. Includes a premium 3D-inspired interface, student accounts, item reports, search/filter, claims, dashboards and a separate administrator-only Account Control Center.

## Run in VS Code
1. Extract the ZIP.
2. Open the `CampusFind_HTML_CSS_JS` folder in VS Code.
3. Open `index.html` in a browser, or use the Live Server extension.
4. No PHP, MySQL, XAMPP, Node.js or build step is required for this frontend demo.

## Demo administrator sign-in
- Email: `aryantiwari1234r@gmail.com`
- Password: `@88582332`

After signing in as admin, use **Password control** in the navigation or **Open Account Control Center** on the admin dashboard. Only an account with the `admin` role can open this screen. The admin can select a student account and set a new password. Password reset activity is recorded in this browser.

## Important security limitation
This is a frontend-only academic demonstration. Accounts, passwords, session state, reset history and listings are stored in browser `localStorage`. A visitor can inspect or modify JavaScript and local storage, so this does **not** provide real security or enforce administrator authorization against a determined user. The reset feature changes only this browser's local demo data; it does not reset an external account or send an email. For a real deployment, use a backend (for example Node/Express, PHP or Django), a database, salted password hashing (Argon2/bcrypt), server-side role checks, secure sessions and verified reset tokens sent by email. Never use the demo password for a real service.

## Branding
Developed by **Himanshu Tiwari** · **TiwariX Web Solutions**


Photo uploads: JPG, PNG and WEBP files up to 10 MB are accepted. Images are automatically resized/compressed before being saved in browser storage. Because this is a frontend-only project using localStorage, storage is still limited by the browser.
