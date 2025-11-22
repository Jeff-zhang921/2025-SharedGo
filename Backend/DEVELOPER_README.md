# Installation and setup

## 1.Prerequisites:

* Node.js(v18 or later)
* npm
* Git

## 2.Clone Repository
```
git clone https://github.com/spe-uob/2025-SharedGo.git
cd Backend
```
## 3.Generate Database in Your local machine
1. Make sure **PostgreSQL** is installed and running locally.  
   You can download it from: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)


2. Open your PostgreSQL shell or pgAdmin, and create a new database named `Sharego`:
   ```sql
   CREATE DATABASE Sharedgo;

## 4.Install Dependencies
> ⚠️ Before running these commands, make sure you have:
> 1. Added your own `.env` file in the Backend root with a valid connection string:
>    ```env
>    DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/Sharedgo
>    ```

* Download all the dependency for express
```
npm ci
```
* Creates the Prisma client files locally inside node_modules
```
npx prisma generate
```

* Apply your schema to the database
```
npx prisma migrate dev
```
## 5. Run Backend
```
npm run dev
```