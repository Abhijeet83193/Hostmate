const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Show booking form
router.get("/new/:listingId", isLoggedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.listingId);
    res.render("bookings/new", { listing });
});

router.post("/", isLoggedIn, async (req, res) => {
    const { listingId, checkIn, checkOut, guests } = req.body;
    const listing = await Listing.findById(listingId);
    const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
    const totalPrice = Math.max(1, days) * listing.price;
    const booking = new Booking({
        listing: listingId,
        user: req.user._id,
        checkIn,
        checkOut,
        guests,
        totalPrice
    });
    await booking.save();
    res.redirect(`/bookings/checkout/${booking._id}`);
});


// Checkout session route
router.get("/checkout/:bookingId", isLoggedIn, async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
            price_data: {
                currency: "inr",
                product_data: {
                    name: booking.listing.title,
                },
                unit_amount: Math.round(booking.totalPrice * 100),
            },
            quantity: 1,
        }],
        mode: "payment",
        success_url: `${process.env.BASE_URL}/bookings/success/${booking._id}`,
        cancel_url: `${process.env.BASE_URL}/bookings/fail/${booking._id}`,
        metadata: { bookingId: booking._id.toString() }
    });
    booking.stripeSessionId = session.id;
    await booking.save();
    res.redirect(session.url);
});



// Checkout session route
router.post("/webhook", express.raw({type: 'application/json'}), async (req, res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const booking = await Booking.findOne({ stripeSessionId: session.id }).populate("user listing");
        if (booking) {
            booking.paymentStatus = "Paid";
            await booking.save();

            // Nodemailer email
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: booking.user.email,
                subject: "Booking Confirmed!",
                text: `Your booking for ${booking.listing.title} is confirmed.`
            });
        }
    }
    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
        const session = event.data.object;
        const booking = await Booking.findOne({ stripeSessionId: session.id });
        if (booking) {
            booking.paymentStatus = "Failed";
            await booking.save();
        }
    }
    res.json({ received: true });
});

// Success & Fail pages
router.get("/success/:bookingId", isLoggedIn, async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate("listing");
    res.render("bookings/success", { booking });
});
router.get("/fail/:bookingId", isLoggedIn, async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate("listing");
    res.render("bookings/fail", { booking });
});


module.exports = router;