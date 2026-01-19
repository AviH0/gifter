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
- **Gift Platforms**: Update the `gifts` array with your platforms. For random URLs, use an array like `["url1", "url2"]`. Add logos to `assets/logos/`.
- **Themes**: Light/dark themes are automatic; backgrounds switch accordingly.
- **Languages**: English/Hebrew toggle is built-in.

Ensure all image paths are correct and committed.</content>
<parameter name="filePath">/home/avih/projects/wedding_gifts/README.md