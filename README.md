# Wedding Gifts Web App

A simple static web app for collecting wedding gifts via various platforms. Supports English and Hebrew, with customizable names, photo, and gift options.

## Deployment on GitHub Pages

1. Fork this repository to your GitHub account.
2. Clone the forked repo to your local machine.
3. Customize the app (see below).
4. Commit and push your changes to the main branch.
5. Go to your repo settings, scroll to "Pages", select "Deploy from a branch", choose "main", and save.
6. Your site will be available at `https://yourusername.github.io/repository-name/`.

## Customization

- **Names**: Edit `js/config.js` to change the bride and groom names in both languages.
- **Wedding Photo**: Replace `assets/wedding.jpg` with your photo.
- **Gift Platforms**: In `js/config.js`, update the `gifts` array with your preferred platforms (e.g., PayPal, Venmo). Add logos to `assets/logos/`.
- **Themes**: The app supports light/dark themes, toggled by users.
- **Languages**: Switch between English and Hebrew using the toggle button.

Ensure all paths are relative and files are committed.</content>
<parameter name="filePath">/home/avih/projects/wedding_gifts/README.md