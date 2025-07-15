# Quran AI Search

A semantic search system for Quranic verses using a local model server and Next.js frontend.

## Setup

### 1. Install Python Dependencies
```bash
cd model
pip install -r requirements.txt
```

### 2. Install Node.js Dependencies
```bash
npm install
# or
yarn install
```

### 3. Download required fonts:
- Create a `src/fonts` directory
- Download Amiri font files from [Google Fonts](https://fonts.google.com/specimen/Amiri):
  - Save `Amiri-Regular.ttf` to `src/fonts/`
  - Save `Amiri-Bold.ttf` to `src/fonts/`

## Running the Application

You need to run both the model server and the Next.js application:

### 1. Start the Model Server
In one terminal:
```bash
cd model
python serve_model.py
```
The model server will run on http://localhost:8000

### 2. Start the Next.js Application
In another terminal:
```bash
npm run dev
# or
yarn dev
```
The Next.js app will run on http://localhost:3000

## Testing the Search

1. Make sure both servers are running
2. Visit http://localhost:3000 in your browser
3. Enter your query in the search box
4. The application will return relevant Quranic verses based on semantic search

## Required Files
Make sure these files are present in the model directory:
- quran_terjemahan_indonesia.jsonl
- quran-qa-2023/Task-A/data/Thematic_QPC/QQA23_TaskA_QPC_v1.1.tsv

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# MuslimAI
