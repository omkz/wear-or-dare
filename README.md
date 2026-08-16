# Wear or Dare 👗🎲

**Spin the challenge. Try the look. Dare to wear it.**

Wear or Dare is a gamified fashion discovery experience powered by the **YouCam Apparel Virtual Try-On API**.

It helps shoppers discover unexpected styles, see themselves wearing those looks, and make fashion buying decisions with more confidence.

---

## The Idea

Online fashion shopping gives people almost unlimited choice.

That is useful — but it can also make discovering something new feel repetitive and overwhelming.

Wear or Dare turns virtual try-on into a game.

Instead of asking:

> "What should I search for?"

the experience asks:

> "Would you dare to wear this?"

The goal is to combine **fashion discovery, play, and virtual try-on** into an experience that helps users explore styles they might otherwise never consider.

---

## How It Works

### 1. Upload Your Photo

Upload or capture a full-body photo.

### 2. Get a Style Dare

Spin the roulette to receive a fashion challenge such as:

- First Date
- Quiet Luxury
- 90s Streetwear
- Festival Mode
- Cyberpunk Office
- Main Character
- Villain Era
- Color Dare

Users can also choose a featured challenge directly.

### 3. Reveal the Look

Each challenge is mapped to a garment from the Wear or Dare catalog.

The selected garment is revealed before generation.

### 4. Virtual Try-On

Wear or Dare sends:

- the user's photo;
- the selected garment image;
- the appropriate garment category

to the **YouCam Apparel Virtual Try-On API**.

The generated result is then retrieved and stored by the application.

### 5. Wear It or Dare Again

After seeing the generated look, the user makes a simple decision:

**Wear It ❤️**

or

**Dare Again 🎲**

### 6. Share the Result

Completed looks can be shared using the browser's native sharing capabilities or downloaded as an image.

---

## Why Wear or Dare?

Fashion discovery usually starts with browsing or searching for something the shopper already knows they want.

That makes it harder to discover unfamiliar styles — and even when shoppers find something interesting, they still have to guess whether it will actually work for them.

Wear or Dare combines discovery and decision-making:

**Challenge → Discover → Virtual Try-On → Decide**

The challenge encourages shoppers to explore something unexpected. YouCam Apparel VTO then lets them see the look on themselves before deciding whether they would actually wear it.

This turns virtual try-on from a product visualization tool into part of the fashion discovery experience.

---

## Who It's For

### Shoppers

People who want to discover new styles without blindly purchasing something that may not suit them.

### Fashion Retailers

Brands and retailers can use challenge-based discovery to introduce shoppers to products and collections they might otherwise overlook.

---

## YouCam Integration

Wear or Dare uses the **YouCam Apparel Virtual Try-On API** as the core AI capability of the experience.

Each active garment has:

- its own reference image;
- an associated challenge;
- the appropriate YouCam apparel category:
  - `upper_body`
  - `lower_body`
  - `full_body`

For each try-on, Wear or Dare sends the user's uploaded photo, the selected garment's reference image, and that garment's apparel category through the provider integration to the YouCam Apparel Virtual Try-On API.

Generation is asynchronous: the application creates the try-on request, tracks the provider task as it processes, and once complete, retrieves and persists the generated result.

The generation flow:

```text
User Photo
    +
Challenge
    ↓
Garment Selection
    ↓
Wear or Dare API
    ↓
YouCam Apparel VTO
    ↓
Generation Status
    ↓
Generated Result
    ↓
Wear It / Dare Again
```

---

## Features

- 🎲 Gamified fashion challenge roulette
- 📸 Photo upload and camera capture
- 👗 Curated garment catalog
- ✨ YouCam Apparel Virtual Try-On
- 🔄 Asynchronous generation flow
- ❤️ Wear It / Dare Again decisions
- 📤 Native share and image download
- 🕘 Personal try-on history
- 👤 User profiles
- 🔐 Google authentication
- 🗄️ Persisted try-on records
- 📱 Mobile-first interface

---

## Screenshots

### Spin a Challenge
![Spin a Challenge](docs/screenshots/spin-challenge.png)

### Reveal the Look
![Reveal the Look](docs/screenshots/garment-reveal.png)

### Virtual Try-On Result
![Virtual Try-On Result](docs/screenshots/final-result.png)

## Tech Stack

### Application

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### Data

- PostgreSQL
- Drizzle ORM

### Authentication

- Better Auth
- Google OAuth

### AI / Virtual Try-On

- YouCam Apparel Virtual Try-On API

### Development Storage

Uploaded and generated images are currently stored using local filesystem storage during development.

---

## Application Flow

```text
Home
 ↓
Upload Photo
 ↓
Spin Challenge
 ↓
Garment Reveal
 ↓
Sign In
 ↓
Create Try-On
 ↓
YouCam Generation
 ↓
Result
 ↓
Wear It / Dare Again
 ↓
Share
```

Users who choose a featured challenge can skip the random selection:

```text
Featured Challenge
 ↓
Upload Photo
 ↓
Selected Challenge + Garment
 ↓
Generate
```

---

## Running Locally

### Requirements

- Node.js
- pnpm
- PostgreSQL
- YouCam API credentials
- Google OAuth credentials

### 1. Clone the repository

```bash
git clone https://github.com/omkz/wear-or-dare.git
cd wear-or-dare
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example configuration:

```bash
cp .env.example .env.local
```

Configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wear_or_dare

YOUCAM_API_KEY=
YOUCAM_API_BASE_URL=https://yce-api-01.makeupar.com
TRY_ON_PROVIDER=youcam

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

For development without consuming YouCam API units:

```env
TRY_ON_PROVIDER=mock
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start the application

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

---

## YouCam Smoke Test

With YouCam credentials configured:

```bash
pnpm youcam:test
```

This can be used to verify the YouCam integration independently of the full UI flow.

---

## Development Commands

```bash
pnpm dev
pnpm lint
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm youcam:test
```

---

## Privacy

Wear or Dare requires explicit consent before uploading a user's photo for virtual try-on processing.

Try-on records are associated with authenticated users, and result records are ownership-protected by the application's authenticated API flow.

The current filesystem-based image storage is intended for development and prototype use.

---

## Future Direction

Potential extensions include:

- retailer product links
- branded fashion challenges
- collection campaigns
- personalized challenge recommendations
- saved looks
- compare/battle modes
- retailer analytics
- hosted object storage and production infrastructure

The core idea remains simple:

> **Discover a look. Try it on. Decide if you dare to wear it.**
