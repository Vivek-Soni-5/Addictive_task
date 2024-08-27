const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Video = require('../models/Video');
const sendEmail = require('../helpers/mailer')
const { getDetails, setDetails } = require('../helpers/memory-cache');

const router = express.Router();


// Register Route
router.post('/register', async (req, res) => {
    const { firstName, lastName, email } = req.body;

    try {
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        } 

        // Create a password from the first 3 letters of the firstName and the email
        const password = `${firstName.slice(0, 3)}${email.slice(0,4)}`;

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ firstName, lastName, email, password });

        await newUser.save();

        // Send email with the generated password
        const subject = "Welcome! Here is your account information";
        const text = `Hello ${firstName},\n\nYour account has been created successfully. Here are your login details:\n\nEmail: ${email}\nPassword: ${password}\n\nPlease keep this information safe.\n\nBest regards,\nAddictive technology`;

        await sendEmail(email, subject, text);

        res.status(201).json({ message: "User registered successfully and check your email for login credentials" });
    } catch (err) {
        res.status(500).json({ message: "Something went wrong" });
        console.log("error occured at register", err);
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { firstName, password } = req.body;

    try {
        const user = await User.findOne({ firstName, password });
        if (!user) return res.status(404).json({ message: "User not found" });

        console.log(user);
        // Set token as cookie
        console.log(user.email);
        setDetails('email', user.email);
        res.status(200).json({ email: user.email });
    } catch (err) {
        console.log("logi err:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
});


router.get('/dashboard', async (req, res) => {
    try {
        const userEmail = getDetails('email');
        console.log("Email:", userEmail);
        const user = await User.findOne({email: userEmail}).populate('videos');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.log("dashboard err:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Upload a video
router.post('/upload', async (req, res) => {
    const { title, videoUrl } = req.body;

    try {
        const video = new Video({ title, videoUrl, user: req.cookies.email });
        const savedVideo = await video.save();

        const user = await User.findOne( req.cookies.email );

        await User.findByIdAndUpdate(user._id, { $push: { videos: savedVideo._id } });

        res.status(201).json(savedVideo);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find().populate('videos');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});



module.exports = router;
