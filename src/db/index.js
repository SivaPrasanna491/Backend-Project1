import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectionDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(connectionInstance);
        console.log(`\n MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR: ", error);
        process.exit(1);
    }
} 


export default connectionDB

//do console log for connectionInstance