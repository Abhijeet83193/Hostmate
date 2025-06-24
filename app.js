const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const MONGO_URL = 'mongodb://127.0.0.1:27017/Hostmate';
const path = require("path");
const ejs = require("ejs");
const methodOverride =  require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

main()
    .then( () => {
        console.log("connected to DB");
    })
    .catch( (err) => {
        console.log(err);
    });

async function main(){
    await mongoose.connect(MONGO_URL);
}
//Index Route 
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    console.log("First listing image:", allListings[0]?.image);
    res.render("listings/index.ejs", { allListings });
}));

//New Route
app.get("/listings/new", wrapAsync (async (req, res) => {
    res.render("listings/new.ejs");
}));

//Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
}));

//Create Route
app.post("/listings", wrapAsync (async (req, res, next) => {
    if (!newListing.image.url || newListing.image.url.trim() === "") {
            newListing.image.url = "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60";
        }
    if(!req.body.listing) {
        throw new ExpressError(400, "Send valid data for listing");
    }
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

//Edit Route 
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
}));

//Update Route
app.put("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

// Alternative catch-all middleware
app.use((req, res, next) => {
    const err = new ExpressError(404, "Page Not Found!");
    next(err);
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something Went Wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

