import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cartItem: [
    {
      restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      restaurantName: {
        type: String,
        required: true,
      },
      deliveryPrice: {
        type: Number,
        required: true,
        default: 10,
      },
      subTotal: {
        type: Number,
        required: true,
        default: 0,
      },
      menuItems: [
        {
          name: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            default: 1,
          },
        },
      ],
    },
  ],
  total: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
