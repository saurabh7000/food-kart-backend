import { Request, Response } from "express";
import Restaurant from "../models/RestuarantModel";

export const searchRestaurant = async (req: Request, res: Response) => {
  try {
    const city = req.params.city;

    const searchQuery = (req.query.searchQuery as string) || "";
    const selectedCuisines = (req.query.selectedCuisines as string) || "";
    const sortOption = (req.query.sortOption as string) || "lastUpdated";
    const page = parseInt(req.query.page as string) || 1;

    let query: any = {};

    query["city"] = new RegExp(city, "i");
    const cityCheck = await Restaurant.countDocuments(query);
    if (cityCheck === 0) {
      res.status(404).json({
        data: [],
        pagination: {
          totalRestaurants: 0,
          totalPage: 1,
          page: 1,
        },
      });
      return;
    }

    if (selectedCuisines) {
      const cuisinesArray = selectedCuisines
        .split(",")
        .map((cuisine) => new RegExp(cuisine, "i"));

      query["cuisines"] = { $all: cuisinesArray };
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      query["$or"] = [
        { restaurantName: searchRegex },
        { cuisines: { $in: [searchRegex] } },
      ];
    }

    const totalPage = 10;
    const skip = (page - 1) * totalPage;

    const restaurants = await Restaurant.find(query)
      .sort({ [sortOption]: 1 })
      .skip(skip)
      .limit(totalPage)
      .lean();

    const totalRestaurants = await Restaurant.countDocuments(query);

    const response = {
      data: restaurants,
      pagination: {
        totalRestaurants,
        totalPage: Math.ceil(totalRestaurants / totalPage),
        page,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: (error as Error).message,
    });
  }
};

export const getRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      res.status(404).json({
        message: "Restaurant not found",
      });
      return;
    }

    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({
      message: (error as Error).message,
    });
  }
};
