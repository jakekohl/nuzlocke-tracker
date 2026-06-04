# Nuzlocke Tracker
Personal Project so I can remember details about my Nuzlocke during playthroughs

## Getting Started
There is the frontend and backend services and I have this currently hosted in Vercel, so `vercel.json` files are in their respective directories and the solution will be tailored to that.

```shell
# First Clone the repo
git clone https://github.com/jakekohl/nuzlocke-tracker

# Setup Backend
cd backend
npm i

# Create secrets .env and fill in values
cp .env.example .env
npm run dev:api

# Setup Frontend
cd frontend
npm i

# Create secrets .env and fill in values
cp .env.example .env
npm run dev
```

## Services
My own personal preference is hosting this in Vercel, hence the Serverless functions setup that are Vercel Specific. You can host this whereever you wish or even run it locally if desired.

Database service leverages MongoDB with the current driver assuming it's hosted on MongoDB Atlas.

## Tests
Frontend Tests leverage Cypress for E2E testing and vitest for unit testing
Backend Tests tbd

## Disclaimers
This is a personal project and there is no guarantee for quality or build success. 