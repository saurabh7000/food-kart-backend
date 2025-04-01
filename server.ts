import express, { json, Request, Response } from "express";
import cors from "cors";
import { config } from "dotenv";
import connectDB from "./config/database";
import UserRoute from "./routers/UserRoute";
import MyRestaurantRoute from "./routers/MyRestaurantRoute";
import RestaurantRoutes from "./routers/RestaurantRoutes";
import OrderRoutes from "./routers/OrderRoutes";
import CartRoutes from "./routers/CartRoutes";
import { v2 as cloudinary } from "cloudinary";

const app = express();

app.use(cors());
app.use("/api/order/checkout/webhook", express.raw({ type: "*/*" }));
app.use(json());
app.use("/api/my/user", UserRoute);
app.use("/api/my/restaurant", MyRestaurantRoute);
app.use("/api/restaurant", RestaurantRoutes);
app.use("/api/my/cart-items", CartRoutes);
app.use("/api/order", OrderRoutes);

config({ path: "./config/.env" });
connectDB();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
