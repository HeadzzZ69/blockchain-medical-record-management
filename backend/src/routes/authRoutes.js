const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

router.post("/nonce", authController.getNonce);
router.post("/verify", authController.verifySignature);
router.post("/session", authController.syncSession);
router.get("/me", verifyToken, authController.getMe);

module.exports = router;
