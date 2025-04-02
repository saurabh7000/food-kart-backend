import { Request, Response } from "express";
import Stripe from "stripe";
import Restaurant from "../models/RestuarantModel";
import Order from "../models/OrderModel";

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;
const frontend_url = process.env.FRONTEND_URL as string;

type CheckoutSessionRequest = {
  cartItems: {
    restaurantId: string;
    menuItems: {
      _id: string;
      name: string;
      quantity: number;
    }[];
  }[];
  deliveryDetails: {
    email: string;
    name: string;
    addressLine: string;
    city: string;
    country: string;
    pincode: number;
  };
};

type menuList = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  restaurant: string;
  restaurantName: string;
  estimatedDeliveryTime: number;
};

const createLineItem = (menuList: menuList[]) => {
  const listItem = menuList.map((menu) => {
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: "inr",
        unit_amount: menu.price * 100,
        product_data: {
          name: menu.name,
        },
      },
      quantity: menu.quantity,
    };
    return line_items;
  });

  return listItem;
};

const createSession = async (
  menuList: Stripe.Checkout.SessionCreateParams.LineItem[],
  orderId: string,
  deliveryPrice: number
) => {
  const sessionData = await stripe.checkout.sessions.create({
    line_items: menuList,
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery",
          type: "fixed_amount",
          fixed_amount: {
            amount: deliveryPrice * 100,
            currency: "inr",
          },
        },
      },
    ],
    mode: "payment",
    metadata: { orderId },
    success_url: `${frontend_url}/order-status?success=true`,
    cancel_url: `${frontend_url}/checkout`,
  });

  return sessionData;
};

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  let event;

  try {
    const sign = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body,
      sign as string,
      STRIPE_ENDPOINT_SECRET
    );
  } catch (error) {
    res.status(400).send(`Webhook error: ${(error as Error).message}`);
  }

  if (event && event.type === "checkout.session.completed") {
    const order = await Order.findById(event.data.object.metadata?.orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    order.totalAmount = event.data.object.amount_total;
    order.status = "paid";

    await order?.save();
  }

  res.status(200).send();
};

export const createCheckOutSession = async (req: Request, res: Response) => {
  try {
    const checkoutSessionRequest: CheckoutSessionRequest = req.body;

    let deliveryPrice = 0;
    const menuList: menuList[] = [];

    for (const item of checkoutSessionRequest.cartItems) {
      const restaurant = await Restaurant.findById({ _id: item.restaurantId });

      if (!restaurant) {
        res.status(404).json({ message: "Restaurant not found!" });
        return;
      }

      const menuItems = restaurant.menuItems
        .map((menu) => {
          return item.menuItems
            .map((reqMenuItem) => {
              if (reqMenuItem._id.toString() === menu.id.toString()) {
                return {
                  _id: menu.id.toString(),
                  name: menu.name,
                  price: menu.price,
                  quantity: reqMenuItem.quantity,
                  restuarant: restaurant.id,
                  restaurantName: restaurant.restaurantName,
                  estimatedDeliveryTime: restaurant.estimatedDeliveryTime,
                };
              }
              return null;
            })
            .filter((item) => item !== null);
        })
        .flat();

      if (menuItems.length === 0) {
        res.status(404).json({ message: "Menu item not found!" });
        return;
      }

      menuItems.forEach((menuItem) => {
        menuList.push({
          menuItemId: menuItem._id.toString(),
          name: menuItem.name,
          price: parseInt(menuItem.price),
          quantity: menuItem.quantity,
          restaurant: menuItem.restuarant,
          restaurantName: menuItem.restaurantName,
          estimatedDeliveryTime: restaurant.estimatedDeliveryTime,
        });
      });

      deliveryPrice += restaurant.deliveryPrice || 0;
    }

    const newOrder = new Order({
      user: req.userId,
      status: "placed",
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: menuList,
    });

    const lineItem = createLineItem(menuList);

    const session = await createSession(
      lineItem,
      newOrder._id.toString(),
      deliveryPrice
    );

    if (!session.url) {
      res.status(500).json({ message: "Error while creating stripe session" });
    }

    await newOrder.save();

    res.status(200).json({
      success: true,
      message: "Payment successfull!",
      url: session.url,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("user")
      .populate("cartItems.restaurant");

    if (!orders) {
      res.status(404).json({ message: "Orders not found" });
      return;
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, restaurantId } = req.params;
    const { status } = req.body;

    if (!orderId || !restaurantId || !status) {
      res.status(400).json({ message: "Please provide required data" });
      return;
    }

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (restaurant?.user?._id.toString() !== req.userId) {
      res.status(401).send();
      return;
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
