# Amer Kadric — Personal Portfolio

> **Live Site:** [amer-portfolio.vercel.app](https://amer-portfolio.vercel.app) <!-- Replace with your actual Vercel URL -->

A modern, responsive personal portfolio website built with React, Vite, and Tailwind CSS. Designed to showcase software development skills, IT management experience, and real-world technical problem solving.

---

## Tech Stack

- **React 18** — component-based UI
- **Vite** — fast dev server and build tool
- **Tailwind CSS** — utility-first styling
- **Lucide React** — icons
- **Vercel** — deployment

---

## Sections

- **Hero** — introduction, profile photo, and call-to-action buttons
- **About** — professional summary and highlight cards
- **Skills** — categorized skill bars and tag cloud
- **Experience** — timeline of professional roles
- **Projects** — featured project cards with tech tags
- **Education** — Wayne State University degree details
- **Resume** — download and view resume PDF
- **Contact** — contact form and direct contact info

---

## Getting Started

**Requirements:** Node.js 18+

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Replacing Your Assets

| File | Location | Purpose |
|------|----------|---------|
| Profile photo | `public/profile.jpg` | Hero section image |
| Resume PDF | `public/resume.pdf` | Download / view resume buttons |

---

## Making the Contact Form Work

The form is wired up and ready — it just needs a Formspree endpoint:

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form and copy your endpoint URL
3. Open `src/components/Contact.jsx` and replace the simulated submit with the fetch call (instructions are in the comments)

---

## Deployment

This site is deployed on Vercel. Every push to the `master` branch automatically triggers a new deployment.

To deploy your own fork:
1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Click Deploy — no configuration needed

---

## Project Structure

```
amer-portfolio/
├── public/
│   ├── profile.jpg       # Profile photo
│   ├── resume.pdf        # Resume file
│   └── favicon.svg       # Browser tab icon
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Skills.jsx
│   │   ├── Experience.jsx
│   │   ├── Projects.jsx
│   │   ├── Education.jsx
│   │   ├── ResumeSection.jsx
│   │   ├── Contact.jsx
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Contact

**Amer Kadric**
- Email: [kadricameer@gmail.com](mailto:kadricameer@gmail.com)
- LinkedIn: [linkedin.com/in/amer-kadric](https://www.linkedin.com/in/amer-kadric)
- GitHub: [github.com/AmerKadric](https://github.com/AmerKadric)
