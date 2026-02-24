require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PranaPredict AI server running on port ${PORT}`);
});
