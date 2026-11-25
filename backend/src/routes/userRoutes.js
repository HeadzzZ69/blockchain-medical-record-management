const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// User directory routes (public/authenticated with normalized on-chain authority)
router.get("/", userController.getAllUsers);
router.get("/all", userController.getAllUsers);

router.post("/register", userController.registerUser);
router.get("/doctors", userController.getDoctors);
router.get("/hospitals", userController.getHospitals);
router.get("/:walletAddress", userController.getUserProfile);

module.exports = router;
