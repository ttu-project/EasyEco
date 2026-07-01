const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
   res.json({
      message: "Product Route Working"
   });
});

module.exports = router;