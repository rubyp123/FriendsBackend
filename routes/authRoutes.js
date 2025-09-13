import express from "express";
import ClientModel from "../models/client.js";
import jwt from "jsonwebtoken";
import { use } from "react";

const router = express.Router();

// Register
router.post('/register' , (req, res) => {
     const { email, name, password } = req.body;
     ClientModel.findOne({ email })
     .then((exixtingUser) => {
        if(exixtingUser){
            return res.status(400).json({ message: "Account already exists!" });
        }
        ClientModel.create({name , email , password})
        .then((client) => {
            res.status(201).json({ message: "Account created successfully!", client });
        })
        .catch((err) => res.status(500).json({ error: err.message }));
     })
     .catch((err) => res.status(500).json({ error: err.message }));  
})

//Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  ClientModel.findOne({ email })
    .then((user) => {
    //   console.log("Found user:", user); 
      if (!user) {
        return res.status(400).json({ message: "No account found with this email!" });
      }

      if (user.password !== password) {
        return res.status(400).json({ message: "Invalid password!" });
      }

      const token = jwt.sign(
        {
            id : user._id,
            email: user.email,
            name:user.name
        },
        process.env.JWT_SECRET,
        {expiresIn:"10h"}
      );

      // console.log()

    //   return res.status(200).json({ message: "Login successful!", user });
        return res.json({
            message: "Login successfully!",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    })
    .catch((err) => {
      console.error("Login error:", err); 
      res.status(500).json({ error: err.message });
    });
});

export default router;


// router.post("/logout", (req, res) => {
//   res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
//   res.json({ message: "Logged out successfully" });
// });