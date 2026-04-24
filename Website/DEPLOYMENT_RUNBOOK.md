# Deployment Runbook

## Overview
This runbook covers how to safely update, build, and deploy the `designedbyomar` portfolio website.

The site is built as a single-page React application powered by Vite, utilizing a custom static-site generation (SSG) step (`postbuild.js`) to produce true SEO-friendly URLs.

## Development Pipeline

1. **Start Local Server:**
   Run `npm run dev` in the root folder to start Vite's ultra-fast hot-reloading development server.

2. **Add or Edit Content:**
   - **Case Studies**: Modify the `CASE_STUDIES` array inside `src/main.jsx`.
   - **Static Assets**: Add images to `Images/`.
   - **Design System Tokens**: Modify `index.css`.

## Production Build Workflow

1. **Compile the App:**
   ```bash
   npm run build
   ```
   *What this does:*
   - Vite bundles all React files and CSS into deeply compressed assets.
   - `postbuild.js` dynamically generates physical folders & HTML files for every single case study in your `CASE_STUDIES` array.
   - It also dynamically injects Title, Description, and OpenGraph SEO tags into the generated HTML pages to guarantee rich social sharing.

2. **Verify Output:**
   Navigate into the `/dist` directory. You should see:
   - `index.html` (Homepage)
   - `404.html` (Error Route)
   - `/work/{project-id}/index.html` (Individual case studies)

## Deployment

The website relies exclusively on static hosting. Because we included `vercel.json` and `netlify.toml`, you can deploy seamlessly to either platform with zero configuration, and your **Security Headers** (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.) will automatically be applied.

### Vercel / Netlify Deploy:
- Connect your GitHub repository to your Vercel or Netlify dashboard.
- Set the Build Command to `npm run build`.
- Set the Output Directory to `dist`.
- Trigger deploy.

## Continuous Maintenance

- **Adding a new Case Study?** Just push it to `src/main.jsx`. The SSG script creates the folders automatically.
- **Updating the Resume?** Overwrite `Omar Tavarez Resume (v2.0) .pdf` but keep the same filename (or update any references in `main.jsx`).

## Post-Launch Quality Assurance

1. Use the **Lighthouse** tab in Google Chrome on the live deployment to ensure performance is 95+.
2. Confirm Google Analytics (GA4) traffic in your console by clicking deep case-study links and toggling the dark/light modes.
