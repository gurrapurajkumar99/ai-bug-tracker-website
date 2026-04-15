# AI Bug Tracker Website

A full-stack bug tracking application with AI-powered severity prediction and real-time analytics.

## 🚀 Live Demo

[View Live Application](https://ai-bug-tracker-website-3qwk2ztzu-2303a51782-srueduins-projects.vercel.app)

## Features

- **AI-Powered Bug Classification**: Automatically predicts bug severity using machine learning
- **Real-time Analytics**: Dashboard with charts and metrics
- **User Management**: Role-based access control (Admin, Developer, Tester)
- **Project Management**: Organize bugs by projects
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: JSON file storage (serverless compatible)
- **Deployment**: Vercel

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open http://localhost:5001 in your browser

## Deployment

This app is configured for deployment on Vercel. The backend uses serverless-compatible storage and the frontend is served statically.

## Demo Accounts

- **Admin**: admin@bugtracker.com / Admin@123456
- **Developer**: dev@bugtracker.com / Dev@123456
- **Tester**: tester@bugtracker.com / Tester@123456

## AI Model

The severity prediction uses a Logistic Regression + Linear Regression model trained on IEEE ICICT 2024 research data, achieving 81% accuracy.