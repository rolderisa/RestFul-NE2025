import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ServerResponse from '../utils/response';

const prisma = new PrismaClient();

export const createParking = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { code, name, totalSpaces, location, hourlyFee } = req.body;

    // Check if parking with same code already exists
    const existingParking = await prisma.parking.findUnique({
      where: { code }
    });

    if (existingParking) {
      return ServerResponse.conflict(res, `Parking with code '${code}' already exists`);
    }

    // Create new parking
    const parking = await prisma.parking.create({
      data: {
        code,
        name,
        totalSpaces,
        availableSpaces: totalSpaces, // Initially, all spaces are available
        location,
        hourlyFee
      }
    });

    return ServerResponse.created(res, parking, 'Parking created successfully');
  } catch (error) {
    console.error('Create parking error:', error);
    return ServerResponse.error(res, 'Failed to create parking');
  }
};

export const getAllParkings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parkings = await prisma.parking.findMany();
    return ServerResponse.success(res, parkings, 'Parkings retrieved successfully');
  } catch (error) {
    console.error('Get all parkings error:', error);
    return ServerResponse.error(res, 'Failed to retrieve parkings');
  }
};

export const getParkingByCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { code } = req.params;

    const parking = await prisma.parking.findUnique({
      where: { code }
    });

    if (!parking) {
      return ServerResponse.notFound(res, `Parking with code '${code}' not found`);
    }

    return ServerResponse.success(res, parking, 'Parking retrieved successfully');
  } catch (error) {
    console.error('Get parking by code error:', error);
    return ServerResponse.error(res, 'Failed to retrieve parking');
  }
};

export const updateParking = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { code } = req.params;
    const { name, totalSpaces, location, hourlyFee } = req.body;

    // Check if parking exists
    const existingParking = await prisma.parking.findUnique({
      where: { code }
    });

    if (!existingParking) {
      return ServerResponse.notFound(res, `Parking with code '${code}' not found`);
    }

    // Calculate available spaces adjustment
    let availableSpacesAdjustment = 0;
    if (totalSpaces !== undefined && totalSpaces !== existingParking.totalSpaces) {
      availableSpacesAdjustment = totalSpaces - existingParking.totalSpaces;
    }

    // Update parking
    const updatedParking = await prisma.parking.update({
      where: { code },
      data: {
        name: name || existingParking.name,
        totalSpaces: totalSpaces || existingParking.totalSpaces,
        availableSpaces: {
          increment: availableSpacesAdjustment
        },
        location: location || existingParking.location,
        hourlyFee: hourlyFee || existingParking.hourlyFee
      }
    });

    return ServerResponse.success(res, updatedParking, 'Parking updated successfully');
  } catch (error) {
    console.error('Update parking error:', error);
    return ServerResponse.error(res, 'Failed to update parking');
  }
};

export const deleteParking = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { code } = req.params;

    // Check if parking exists
    const existingParking = await prisma.parking.findUnique({
      where: { code }
    });

    if (!existingParking) {
      return ServerResponse.notFound(res, `Parking with code '${code}' not found`);
    }

    // Check if there are any active entries for this parking
    const activeEntries = await prisma.entry.count({
      where: {
        parkingCode: code,
        exitDateTime: null
      }
    });

    if (activeEntries > 0) {
      return ServerResponse.conflict(res, `Cannot delete parking with active entries`);
    }

    // Delete parking
    await prisma.parking.delete({
      where: { code }
    });

    return ServerResponse.success(res, null, 'Parking deleted successfully');
  } catch (error) {
    console.error('Delete parking error:', error);
    return ServerResponse.error(res, 'Failed to delete parking');
  }
};

export const getAvailableParkings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parkings = await prisma.parking.findMany({
      where: {
        availableSpaces: {
          gt: 0
        }
      }
    });

    return ServerResponse.success(res, parkings, 'Available parkings retrieved successfully');
  } catch (error) {
    console.error('Get available parkings error:', error);
    return ServerResponse.error(res, 'Failed to retrieve available parkings');
  }
};