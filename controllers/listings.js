const Listing = require("../models/listing");
const axios = require("axios");


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    console.log("First listing image:", allListings[0]?.image);
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm =  async (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path: "reviews", 
        populate: {path: "author"},
    }).populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
};



module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;

    // Listing ka data
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    try {
        // Forward Geocoding
        const cityName = req.body.listing.location; // location field ka naam form se aana chahiye
        const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: cityName,
                format: "json",
                limit: 1
            },
            headers: {
                "User-Agent": "Hostmate/1.0"
            }
        });

        if (geoResponse.data.length > 0) {
            const { lat, lon } = geoResponse.data[0];
            console.log("Coordinates found:", lat, lon); 
            newListing.geometry = {
                type: "Point",
                coordinates: [parseFloat(lon), parseFloat(lat)]
            };
        } else {
            console.log("No coordinates found for:", cityName);
        }

        await newListing.save();
        req.flash("success", "New listing created!");
        res.redirect("/listings");

    } catch (error) {
        console.error("Geocoding error:", error);
        req.flash("error", "Could not fetch location coordinates!");
        res.redirect("/listings/new");
    }
};




module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    
    
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250,q_auto:low");
    console.log("Transformed Image URL:", originalImageUrl); 
    res.render("listings/edit.ejs",{listing , originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }

    req.flash("success", "listing updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "listing deleted! ");
    res.redirect("/listings");
};