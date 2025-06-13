# Poker App

A web application designed to **track poker buy-ins** and **log hands** for players.
Ideal for home games to maintain accurate, real-time records of player activities.

## Motivation

During poker home games with my friends, each player's buy-ins were tracked manually by a designated treasurer in a group chat.
This approach created a tradeoff between accuracy, efficiency, and accessibility of information, leading to recurring frustration, especially since real money was involved.

I created this app to give our group a lightweight, reliable way to log buy-ins while also sharpening my full-stack development skills.
As a bonus, I implemented quality-of-life features like hand-logging, enabling players to reflect on how lucky or unlucky they were during a session.

To preserve the integrity of the games, these features were intentionally designed to hide real-time information from other players, which influenced many of my design choices.

## Features

- **Secure player authentication**
- **Randomised starting positions** for fairness
- **Buy-in tracking**
  - Log and view all buy-ins per player with timestamps
- **Player participation toggle** ("dealt in" status)
- **Hand logging** for each round:
  - Track whether you voluntarily put chips in the pot (VPIP)
  - Optionally log your hole cards
- **Real-time hand statistics** (available only for your own hands)
- **Screen-obscured hand input system**
  - To preserve in-game integrity, card inputs are **shifted**
  - This prevents players from inferring others' hands by screen-watching.  
    For example, seeing a player tap the top of their screen twice shouldn't reveal they have pocket Aces.  
![Shifted hand input demo](https://github.com/user-attachments/assets/126d0ec5-1d6a-46eb-b87f-f0882bab9ab4)

## Tech Stack

- **Frontend**: React, TypeScript, Vite  
- **Backend**: Node.js, Express, TypeScript  
- **Database**: PostgreSQL  
- **Routing**: React Router v7  
- **Deployment**: Neon, Render, Vercel  

## Running the App

### Website

The web application is hosted on Vercel:  
https://poker-app-liart.vercel.app/register.

> **NOTE:** The backend may take up to 60 seconds to respond after a period of inactivity.

### Running Locally

#### Prerequisites

- **Node.js:** v18 or higher
- **PostgreSQL:** v13 or higher

#### Installation

**1. Clone the repository**

```bash
# Using HTTPS
git clone https://github.com/dcai22/pokerApp.git

# Or using SSH
git clone git@github.com:dcai22/pokerApp.git
```

**2. Install dependencies**

```bash
cd pokerApp
npm install
```

**3. Configure environment variables**

Create a .env file in the root directory and add the following:
```env
LOCAL_DB_PASSWORD=your_postgres_password
```

**4. Set up the database**

Open a terminal and switch to the postgres user:
```bash
sudo -i -u postgres
psql
```
Then run the following SQL commands:
```sql
CREATE DATABASE poker_app;
\c poker_app
\i /full/path/to/pokerApp/server/database.sql
```

**5. Ensure `db.ts` is in local development mode**

In `db.ts`, uncomment the code directly under `FOR DEVELOPMENT`, and comment out the code directly under `FOR DEPLOYMENT`.

**6. Start the backend server**

```bash
npx tsx server/server.ts
```

**7. Start the frontend server**

In another terminal:
```bash
npm run dev
```

**8. Access the web application online**

Your terminal or IDE may direct you to `http://127.0.0.1:5173`, but accessing the app via this URL can cause CORS errors.
To avoid this, please use the URL `http://localhost:5173/register` instead.
