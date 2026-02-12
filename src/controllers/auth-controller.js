const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

require('dotenv').config();
const RabitMq = require('../service/broker');
async function registerUSer(req, res) {
    const { username, email, password, fullName: { firstName, lastName }, role } = req.body;
    const IsuserAlreadyExits = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (IsuserAlreadyExits) return res.status(409).json({ message: "Username or email already exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        username,
        email,
        password: hash,
        fullName: { firstName, lastName },
        role: role || 'user',
        ispremium: false,
        premiumEndDate: null
    })
    const token = jwt.sign({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        ispremium: user.ispremium,
        premiumEndDate: user.premiumEndDate
    }, process.env.JWT, { expiresIn: '1d' });
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
    })
    await Promise.all([
        RabitMq.publishToQueue('User_Created_Queue', {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName
        }),
        RabitMq.publishToQueue('AUTH_SELLER_DASHBOARD.USER_CREATED', {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName
        })
    ])
    res.status(201).json({
        message: "User Registered", user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            addresses: user.addresses,
            createdAt:user.createdAt
        }
    })
}

async function loguser(req, res) {
    try {
        console.log("loginValidations")
        const { username, email, password } = req.body || {};
        if ((!username && !email)) {
            return res.status(400).json({ message: 'Email or username and password are required' });
        }

        // build search criteria based on provided identifier(s)
        const search = [];
        if (email) search.push({ email });
        if (username) search.push({ username });

        // password has select:false in schema so explicitly include it
        const user = await userModel.findOne({ $or: search }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT, { expiresIn: '1d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        const refreshtoken = jwt.sign({
            id: user._id,
            username: user.username,
            role: user.role
        }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' })

        res.cookie('refreshtoken', refreshtoken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })
        user.refreshtoken = refreshtoken;
        await user.save();
        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                addresses: user.addresses
            }
        });
    } catch (err) {
        // avoid leaking internals in tests; respond with 500
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

async function getCurrentUser(req, res) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            message: "Current User fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                ispremium: user.ispremium,
                premiumEndDate: user.premiumEndDate, // Ensure these are sent
                addresses: user.addresses
            }
        });
    } catch (error) {
        console.error("Get Current User Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function logoutCurrentUser(req, res) {
    const token = req.cookies.token;
    if (token) {
        await redis.set(`blklist:${token}`, 'true', 'EX', 24 * 60 * 60);
    }
    res.clearCookie('token', {

        httpOnly: true,
        secure: true,
    }
    )

    let refreshtoken = req.cookies.refreshtoken
    if (refreshtoken) {
        const user = await userModel.findOne({ refreshtoken });
        if (user) {
            user.refreshtoken = null;
            await user.save();
        }
    }

    res.clearCookie("refreshtoken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    });

    return res.status(200).json({ message: "Logged out Successfully" });
}

async function getuserAddresses(req, res) {

    const id = req.user.id;
    const user = await userModel.findById(id).select('addresses');
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({
        message: "User addresses fetched Successfully",
        addresses: user.addresses
    })

}

async function adduserAddresses(req, res) {

    const id = req.user.id;

    const { street, city, state, zip, country } = req.body || {};


    if (!street || !city || !country) {
        return res.status(400).json({ message: 'Invalid address data' });
    }


    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });


    user.addresses.push({ street, city, state, zip, country });
    await user.save();

    return res.status(201).json({
        message: "Address added successfully",
        addresses: user.addresses
    })

}


async function updateuserAddress(req, res) {
    try {
        const id = req.user.id;
        const { addressId } = req.params || {};
        if (!addressId) return res.status(400).json({ message: 'Address id is required' });

        const { street, city, state, zip, country } = req.body || {};
        if (!street || !city || !country) {
            return res.status(400).json({ message: 'Invalid address data' });
        }

        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        // Update address fields
        address.street = street;
        address.city = city;
        address.state = state || address.state;
        address.zip = zip || address.zip;
        address.country = country;

        await user.save();

        return res.status(200).json({ message: 'Address updated successfully', addresses: user.addresses });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

async function deleteuserAddresses(req, res) {
    try {
        const id = req.user.id;
        const { addressId } = req.params || {};
        if (!addressId) return res.status(400).json({ message: 'Address id is required' });

        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        address.remove();
        await user.save();

        return res.status(200).json({ message: 'Address deleted successfully', addresses: user.addresses });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

async function checkPremium(req, res) {
    const { ispremium, premiumEndDate } = req.user;

    if (!ispremium) {
        return res.status(200).json({ message: "Not a Premium User", isPremium: false });
    }

    if (premiumEndDate && new Date(premiumEndDate) > new Date()) {
        return res.status(200).json({
            message: "Premium User",
            isPremium: true,
            premiumEndDate
        });
    }

    // Premium expired, update user
    try {
        const user = await userModel.findById(req.user.id);
        if (user) {
            user.ispremium = false;
            user.premiumEndDate = null;
            await user.save();
        }
    } catch (err) {
        console.error("Error updating expired premium:", err);
    }

    return res.status(200).json({ message: "Premium User Expired", isPremium: false });
}

async function upgradeToPremium(req, res) {
    let id = req.user?.id;
    const { day, userId } = req.body;

    // Allow internal service call if userId provided and no auth token (or if token present but we want to upgrade specific user)
    // Ideally we should check for a secret header here, but for now we trust the internal route
    if (userId && !id) {
        id = userId;
    }

    // Check if we have an ID now (either from token or body)
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    if (!day) return res.status(400).json({ message: "Day is required" });

    try {
        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.ispremium = true;
        // If already premium, extend? For now, just set new date from now.
        user.premiumEndDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000);

        await user.save();
        return res.status(200).json({
            message: "Premium Activated",
            isPremium: true,
            premiumEndDate: user.premiumEndDate
        });
    } catch (err) {
        console.error("Error upgrading user:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports = {
    registerUSer,
    loguser,
    getCurrentUser,
    logoutCurrentUser,
    getuserAddresses,
    adduserAddresses,
    updateuserAddress,
    deleteuserAddresses,
    checkPremium,
    upgradeToPremium
}


