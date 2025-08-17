const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });


//Search Route
router.get('/search', async (req, res) => {
    const { q } = req.query;
    const listings = await Listing.find({
        $or: [
            { title: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } },
            { country: { $regex: q, $options: 'i' } }
        ]
    });
    res.render('listings/index', { allListings: listings });
});

//index and create
router.route("/") 
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn,upload.single("listing[image]"), validateListing, wrapAsync(listingController.createListing));

//New Route
router.get("/new",isLoggedIn, wrapAsync(listingController.renderNewForm));

//show, update, delete
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, upload.single("listing[image]"),  validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Edit Route 
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));



module.exports= router;