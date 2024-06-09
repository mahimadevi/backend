const express = require("express");
const router = new express.Router();
const products = require("../models/productSchema");
const USER = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");



// get the products data
router.get("/getproducts", async (req, res) => {
    try {
        const productdata = await products.find();
        // console.log(productdata + "data mila hain");
        res.status(201).json(productdata);
    } catch (error) {
        console.log("error" + error.message);
    }
});

//get individual data
router.get("/getproductsone/:id",async(req, res)=>{
    try{
        const{id}=req.params;
        // console.log(id);

        

        const individualdata = await products.findOne({id:id});
        //  console.log(individualdata + "individual data");
        res.status(201).json(individualdata);
    }catch(error){
        res.status(400).json(individualdata);
        console.log("error" + error.message);
    }
} )


// register the data
router.post("/register", async (req, res) => {
    
    const { fname, email, mobile, password, cpassword } = req.body;

    if (!fname || !email || !mobile || !password || !cpassword) {
        res.status(422).json({ error: "fill the all details" });
    };

    try {

        const preuser = await USER.findOne({ email: email });

        if (preuser) {
            res.status(422).json({ error: "This email is already exist" });
        } else if (password !== cpassword) {
            res.status(422).json({ error: "password are not matching" });;
        } else {

            const finaluser = new USER({
                fname, email, mobile, password, cpassword
            });

            // yaha pe hasing krenge
            
            const storedata = await finaluser.save();
            res.status(201).json(storedata);

        }

    } catch (error) {
        console.log("error the bhai catch ma for registratoin time" + error.message);
        res.status(422).send(error);
    }

});


// login data
// router.post("/login", async (req, res) => {
//     // console.log(req.body);
//     const { email, password } = req.body;

//     if (!email || !password) {
//         res.status(400).json({ error: "fill the details" });
//     }

//     try {

//         const userlogin = await USER.findOne({ email: email });
//         console.log(userlogin);
//         if (userlogin) {
//             const isMatch = await bcrypt.compare(password, userlogin.password);

//             const token = await userlogin.generateAuthtoken();
//             console.log(token);

//             res.cookie("ecommerce", token,{
//                 httpOnly: true,
//                 expires:new Date(Date.now() + 9000000)   
//             });

//             if (!isMatch) {
//                 res.status(400).json({ error: "invalid crediential pass1" });
//             } 
//             else {
//                 // console.log(document.cookie);
//                 res.status(201).json(userlogin);
//             }
//         }
//         else {
//             res.status(400).json({error: "user not exist"});
//         }

//     } catch (error) {
//         res.status(400).json({ error: "invalid crediential pass" });
//         console.log("error the bhai catch ma for login time" + error.message);
//     }
// });


// adding the data into cart


router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please fill in all the details." });
    }

    try {
        const userlogin = await USER.findOne({ email: email });
        if (!userlogin) {
            return res.status(400).json({ error: "User does not exist." });
        }
        
        const isMatch = await bcrypt.compare(password, userlogin.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        // Generate a token
        const token = await userlogin.generateAuthtoken();
        console.log(token);

        // Set the token in a httpOnly cookie
        res.cookie("ecommerce", token, {
            expires: new Date(Date.now() + 9000000), // Cookie expires in approximately 2.5 hours
            httpOnly: true, // The cookie is only accessible by the web server
            secure: false, // For development, set secure to false. For production, it should be true.
            sameSite: 'lax' // 'lax' allows some cross-site usage. Use 'none' and secure: true if cross-site requests are needed.
        });

        res.status(200).json({ message: "Login successful.", user: userlogin });
    } catch (error) {
        console.error("Error during login: " + error.message);
        res.status(500).json({ error: "An error occurred during the login process." });
    }
});



// adding the data into cart
router.post("/addcart/:id", authenticate, async (req, res) => {

    try {
        const { id } = req.params;
        const cart = await products.findOne({ id: id });
        console.log(cart + "cart milta hain");

        const Usercontact = await USER.findOne({ _id: req.userID });
        console.log(Usercontact + "user milta hain");


        if (Usercontact) {
            const cartData = await Usercontact.addcartdata(cart);

            await Usercontact.save();
            console.log(cartData + " thse save wait kr");
            console.log(Usercontact + "userjode save");
            res.status(201).json(Usercontact);
        }else{
            res.status(401).json({error: "invalid user"})
        }
    } catch (error) {
        console.log(error);
    }
});


//get data into the cart
router.get("/cartdetails", authenticate, async (req, res) => {
    try {
        const buyuser = await USER.findOne({ _id: req.userID });
        console.log(buyuser + "user hain buy pr");
        res.status(201).json(buyuser);
    } catch (error) {
        console.log(error + "error for buy now");
    }
});

// get user is login or not
router.get("/validuser", authenticate, async (req, res) => {
    try {
        const validuserone = await USER.findOne({ _id: req.userID });
        console.log(validuserone + "user hain home k header main pr");
        res.status(201).json(validuserone);
    } catch (error) {
        console.log(error + "error for valid user");
    }
});


// for userlogout
router.get("/logout", authenticate, async (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((currelem) => {
            return currelem.token !== req.token
        });

        res.clearCookie("ecommerce", { path: "/" });
        req.rootUser.save();
        res.status(201).json(req.rootUser.tokens);
        console.log("user logout");

    } catch (error) {
        console.log(error + "jwt provide then logout");
    }
});


// item remove ho rhi hain lekin api delete use krna batter hoga
// remove iteam from the cart

router.delete("/remove/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        req.rootUser.carts = req.rootUser.carts.filter((curval) => {
            return curval.id != id
        });

        req.rootUser.save();
        res.status(201).json(req.rootUser);
        console.log("iteam remove");

    } catch (error) {
        console.log(error + "jwt provide then remove");
        res.status(400).json(error);
    }
});



module.exports = router;