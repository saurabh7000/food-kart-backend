import { Request, Response } from "express";
import User from "../models/UserModel";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { auth0Id } = req.body;

    const existingUser = await User.findOne({ auth0Id });

    if (existingUser) {
      res.status(200).json({
        success: false,
        message: "User already exists !",
      });

      return;
    }

    const newUser = new User(req.body);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "New User created successfully",
      newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { name, addressLine, country, city, pinCode } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });

      return;
    }

    user.name = name;
    user.address = addressLine;
    user.country = country;
    user.city = city;
    user.pinCode = pinCode;

    await user.save();

    res.status(201).json({
      success: true,
      message: "User prifile updated successfully !",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating updating user",
    });
  }
};

export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ _id: req.userId });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });

      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
