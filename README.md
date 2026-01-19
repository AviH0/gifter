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

Edit `js/config.js` to personalize:

- **Repo Name**: Change `repoName` to your GitHub repository name (default: "gifter"). This sets the base path for assets.
- **Title**: Update `title.en` and `title.he` for the page title.
- **Message**: Update `message.en` and `message.he` for the gift prompt.
- **Wedding Photo**: Replace `assets/wedding.png` with your photo, and update the path in `image`.
- **Background Images**: Add `assets/bg-light.jpg` and `assets/bg-dark.jpg` for themes, update paths in `backgroundLight` and `backgroundDark`.
- **Fonts**: Customize `fonts.primary` (for titles, default: 'Dancing Script') and `fonts.secondary` (for body text, default: 'Montserrat'). Ensure the font is loaded in the HTML if not Google Fonts.
- **Meta Tags**: Update `meta.title`, `meta.description`, `meta.image` (for social media previews), and `meta.url` in `config.js`. Add `assets/favicon.ico` for the page icon.
