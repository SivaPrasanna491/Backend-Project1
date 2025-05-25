// require('dotenv').config({oath: './env'})
import dotenv from "dotenv"
import app from "./app.js";
import connectionDB from "./db/index.js";

dotenv.config({
    path: './.env'
})  
connectionDB()
.then(() => {
    app.on("error", (error) => {
        console.log(error);
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Express is listening at ${process.env.PORT} port`);
    })
})
.catch((err) => {
    console.log("MONGODB Connection failed !!! ", err);
})








/*
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`Express is listening on ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR: ", error);
    }
})()*/