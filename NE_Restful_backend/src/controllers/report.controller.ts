import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ServerResponse from '../utils/response';

const prisma = new PrismaClient();

export const getOutgoingCarsByDateRange = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return ServerResponse.badRequest(res, 'Start date and end date are required');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ServerResponse.badRequest(res, 'Invalid date format. Use ISO format (YYYY-MM-DD)');
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Get outgoing cars in date range
    const outgoingCars = await prisma.entry.findMany({
      where: {
        exitDateTime: {
          gte: start,
          lte: end
        }
      },
      include: {
        parking: true
      },
      orderBy: {
        exitDateTime: 'asc'
      }
    });

    // Calculate total amount charged
    const totalAmountCharged = outgoingCars.reduce((acc, entry) => {
      return acc + Number(entry.chargedAmount || 0);
    }, 0);

    const report = {
      startDate: start,
      endDate: end,
      totalEntries: outgoingCars.length,
      totalAmountCharged,
      entries: outgoingCars
    };

    return ServerResponse.success(res, report, 'Outgoing cars report generated successfully');
  } catch (error) {
    console.error('Get outgoing cars report error:', error);
    return ServerResponse.error(res, 'Failed to generate outgoing cars report');
  }
};

export const getIncomingCarsByDateRange = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return ServerResponse.badRequest(res, 'Start date and end date are required');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ServerResponse.badRequest(res, 'Invalid date format. Use ISO format (YYYY-MM-DD)');
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Get incoming cars in date range
    const incomingCars = await prisma.entry.findMany({
      where: {
        entryDateTime: {
          gte: start,
          lte: end
        }
      },
      include: {
        parking: true
      },
      orderBy: {
        entryDateTime: 'asc'
      }
    });

    const report = {
      startDate: start,
      endDate: end,
      totalEntries: incomingCars.length,
      entries: incomingCars
    };

    return ServerResponse.success(res, report, 'Incoming cars report generated successfully');
  } catch (error) {
    console.error('Get incoming cars report error:', error);
    return ServerResponse.error(res, 'Failed to generate incoming cars report');
  }
};

export const getParkingOccupancyReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parkings = await prisma.parking.findMany();

    const occupancyReport = await Promise.all(parkings.map(async (parking) => {
      const activeEntries = await prisma.entry.count({
        where: {
          parkingCode: parking.code,
          exitDateTime: null
        }
      });

      return {
        parkingCode: parking.code,
        parkingName: parking.name,
        totalSpaces: parking.totalSpaces,
        occupiedSpaces: activeEntries,
        availableSpaces: parking.availableSpaces,
        occupancyRate: (activeEntries / parking.totalSpaces) * 100
      };
    }));

    return ServerResponse.success(res, occupancyReport, 'Parking occupancy report generated successfully');
  } catch (error) {
    console.error('Get parking occupancy report error:', error);
    return ServerResponse.error(res, 'Failed to generate parking occupancy report');
  }
};

export const getRevenueReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return ServerResponse.badRequest(res, 'Start date and end date are required');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ServerResponse.badRequest(res, 'Invalid date format. Use ISO format (YYYY-MM-DD)');
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Get completed entries in date range
    const entries = await prisma.entry.findMany({
      where: {
        exitDateTime: {
          gte: start,
          lte: end
        }
      },
      include: {
        parking: true
      }
    });

    // Calculate total revenue
    const totalRevenue = entries.reduce((acc, entry) => {
      return acc + Number(entry.chargedAmount || 0);
    }, 0);

    // Group by parking if specified
    let revenueByGroup: any = {};
    
    if (groupBy === 'parking') {
      // Group by parking
      revenueByGroup = entries.reduce((acc: any, entry) => {
        const parkingCode = entry.parkingCode;
        if (!acc[parkingCode]) {
          acc[parkingCode] = {
            parkingCode,
            parkingName: entry.parking.name,
            entries: 0,
            revenue: 0
          };
        }
        acc[parkingCode].entries += 1;
        acc[parkingCode].revenue += Number(entry.chargedAmount || 0);
        return acc;
      }, {});
      
      // Convert to array
      revenueByGroup = Object.values(revenueByGroup);
    } else if (groupBy === 'day') {
      // Group by day
      revenueByGroup = entries.reduce((acc: any, entry) => {
        if (!entry.exitDateTime) return acc;
        
        const date = new Date(entry.exitDateTime).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            entries: 0,
            revenue: 0
          };
        }
        acc[date].entries += 1;
        acc[date].revenue += Number(entry.chargedAmount || 0);
        return acc;
      }, {});
      
      // Convert to array and sort by date
      revenueByGroup = Object.values(revenueByGroup).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    const report = {
      startDate: start,
      endDate: end,
      totalEntries: entries.length,
      totalRevenue,
      groupBy: groupBy || 'none',
      groupedData: groupBy ? revenueByGroup : null
    };

    return ServerResponse.success(res, report, 'Revenue report generated successfully');
  } catch (error) {
    console.error('Get revenue report error:', error);
    return ServerResponse.error(res, 'Failed to generate revenue report');
  }




  
};


export const generateEntriesReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ServerResponse.error(res, 'Start date and end date are required', 400);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return ServerResponse.error(res, 'Invalid date range', 400);
    }

    const entries = await prisma.entry.findMany({
      where: {
        entryDateTime: {
          gte: start,
          lte: end,
        },
      },
      include: {
        parking: true,
      },
    });

    const report = entries.map(entry => ({
      id: entry.id,
      plateNumber: entry.plateNumber,
      parkingName: entry.parking.name,
      entryDateTime: entry.entryDateTime,
      exitDateTime: entry.exitDateTime,
      chargedAmount: entry.chargedAmount,
    }));

    return ServerResponse.success(res, report, 'Entries report generated successfully');
  } catch (error) {
    console.error('Generate entries report error:', error);
    return ServerResponse.error(res, 'Failed to generate entries report', 500);
  }
};
