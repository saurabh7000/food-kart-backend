import { Request, Response } from "express";
import User from "../models/UserModel";
import Cart from "../models/CartModel";
import Restaurant from "../models/RestuarantModel";
import mongoose from "mongoose";

interface MenuItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartItem {
  restaurantId: mongoose.Schema.Types.ObjectId;
  restaurantName: string;
  deliveryPrice: number;
  subTotal: number;
  menuItems: MenuItem[];
}

const getSubTotal = (menuItems: any) => {
  let total: number = 0;

  menuItems.map((item: any) => {
    const itemTotal: number = item.price * item.quantity;
    total += itemTotal;
  });

  return total;
};

export const createUpdateCart = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { myOrderCart } = req.body;

    if (!myOrderCart || myOrderCart.length === 0) {
      res.status(400).json({ message: "No cart items provided" });
      return;
    }

    let myCart = await Cart.findOne({ user: user._id });

    let total = 0;

    if (!myCart) {
      myCart = new Cart({
        user: user._id,
        cartItem: [],
        total: 0,
      });
      await myCart.save();
    }

    for (const restaurant of myOrderCart) {
      const myCartRestaurant = myCart.cartItem.find(
        (item) => item.restaurantId.toString() === restaurant.restaurantId
      );

      if (myCartRestaurant) {
        for (const menuItem of restaurant.orderItems) {
          const existingMenuItem = myCartRestaurant.menuItems.find(
            (item) => item.name === menuItem.name
          );

          if (existingMenuItem) {
            if (menuItem.quantity === 0) {
              myCartRestaurant.menuItems.remove(menuItem);
            } else {
              existingMenuItem.quantity = menuItem.quantity;
            }
          } else {
            if (menuItem.quantity > 0) {
              myCartRestaurant.menuItems.push(menuItem);
            }
          }
        }
      } else {
        const newRestaurant = await Restaurant.findById(
          restaurant.restaurantId
        );

        if (!newRestaurant) {
          res.status(400).json({ message: "Restaurant not found" });
          return;
        }

        const newRestaurantMenu = restaurant.orderItems.filter(
          (item: any) => item.quantity > 0
        );

        if (newRestaurantMenu.length > 0) {
          myCart.cartItem.push({
            restaurantId: newRestaurant._id,
            restaurantName: newRestaurant.restaurantName,
            deliveryPrice: newRestaurant.deliveryPrice,
            subTotal: 0,
            menuItems: newRestaurantMenu,
          });
        }
      }
    }

    total = 0;
    for (const restaurantInfo of myCart.cartItem) {
      const currTotal = getSubTotal(restaurantInfo.menuItems);

      if (currTotal <= 0) {
        myCart.cartItem.remove(restaurantInfo);
        continue;
      }

      const subTotal = currTotal + restaurantInfo.deliveryPrice;
      restaurantInfo.subTotal = subTotal || 0;
      total += subTotal || 0;
    }

    myCart.total = total || 0;

    await myCart.save();

    if (myCart.total === 0) {
      await Cart.deleteOne({ _id: myCart._id });
      return;
    }

    res.status(200).json(myCart);
  } catch (error) {
    res.status(500).json({
      message: (error as Error).message,
    });
  }
};

export const getCartOrders = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(400).json("User not found");
      return;
    }

    const myCart = await Cart.findOne({ user });
    if (!myCart) {
      res.status(404).json([]);
      return;
    }
    res.status(200).json(myCart);
  } catch (error) {
    res.status(500).json({
      message: (error as Error).message,
    });
  }
};

export const deleteCartItem = async (req: Request, res: Response) => {
  try {
    const { cartId, itemToDelete } = req.params;

    if (!cartId || !itemToDelete) {
      res
        .status(400)
        .json({ message: "Please provide a valid id of the item to delete" });
      return;
    }

    const restaurantItemDeleted = await Cart.updateOne(
      { _id: cartId },
      { $pull: { cartItem: { restaurantId: itemToDelete } } }
    );

    const cuisineItemDeleted = await Cart.updateOne(
      {
        _id: cartId,
        "cartItem.menuItems._id": itemToDelete,
      },
      {
        $pull: {
          "cartItem.$.menuItems": { _id: itemToDelete },
        },
      }
    );

    if (!restaurantItemDeleted && !cuisineItemDeleted) {
      res.status(404).json({ message: "Restaurant not found in the cart" });
      return;
    }

    const myCart = await Cart.findById({_id:cartId})

    if(!myCart){
      res.status(404).json({message: "Cart not found"})
      return;
    }

    let total = 0;
    for (const restaurantInfo of myCart.cartItem) {
      const currTotal = getSubTotal(restaurantInfo.menuItems);

      if (currTotal <= 0) {
        myCart.cartItem.remove(restaurantInfo);
        continue;
      }

      const subTotal = currTotal + restaurantInfo.deliveryPrice;
      restaurantInfo.subTotal = subTotal || 0;
      total += subTotal || 0;
    }

    myCart.total = total || 0;

    await myCart.save();

    if (myCart.total === 0) {
      await Cart.deleteOne({ _id: myCart._id });
    }

    res
      .status(200)
      .json({ message: "Restaurant removed from cart successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: (error as Error).message,
    });
  }
};
