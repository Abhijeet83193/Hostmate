const express = require("express");
const app = express();
const mongoose = require("mongoose");

const MONGO_URL = mongoose.connect('mongodb://127.0.0.1:27017/test');

async function main(){
    await mongoose.connect(MONGO_URL);
}

main()
    .then( () => {
        console.log("connected to DB");
    })
    .catch( (err) => {
        console.log(err);
    });

app.get("/", (req,res) => {
    res.send("I am root");
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

