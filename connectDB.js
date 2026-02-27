import mongoose from "mongoose";

export default async function connectDB () {
    try{
        
        await mongoose.connect(process.env.DATABASE_URL);
        console.log(`Database Connected !!!`);

    } catch (err){

        console.log(`Database connection error: ${err}`);

    }
}