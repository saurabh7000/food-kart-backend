import mongoose, { mongo } from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  deliveryDetails: {
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    addressLine: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
    },
  },
  cartItems: [
    {
      menuItemId: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
      },
      restaurantName: {
        type: String,
        required: true,
      },
      estimatedDeliveryTime: {
        type: Number,
        required: true,
        default: 10,
      },
    },
  ],
  totalAmount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["placed", "paid", "inProgress", "outForDelivery", "delivered"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
