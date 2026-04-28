import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";
dotenv.config({ path: "./.env" });


connectDB()
  .then(() => {
    const port = process.env.PORT || 8000;
    console.log("PORT:", process.env.PORT);

    app.listen(port, () => {
      console.log("App is Listening at Port:", port);
    });
  })
  .catch((error) => {
    console.log("Database Connection Failed:", error);
  });

//   for Checking the .env file is perfectly working or not
//   console.log("DOTENV RESULT:", result);
// console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);