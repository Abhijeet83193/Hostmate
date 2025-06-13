const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        default:
             "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=600",
        type: String,
        set: (v) => 
            v=== "" ? "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=600" 
            : v,
    },
    price: Number,
    location: String,
    country: String,
});

const Listing = mongoose.model("listing", listingSchema);
module.exports = Listing;