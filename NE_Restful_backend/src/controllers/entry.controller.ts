import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ServerResponse from '../utils/response';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

export const registerEntry = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { plateNumber, parkingCode } = req.body;

    // Check if parking exists
    const parking = await prisma.parking.findUnique({
      where: { code: parkingCode }
    });

    if (!parking) {
      return ServerResponse.notFound(res, `Parking with code '${parkingCode}' not found`);
    }

    // Check if there's available space
    if (parking.availableSpaces <= 0) {
      return ServerResponse.badRequest(res, `No available spaces in parking '${parking.name}'`);
    }

    // Check if vehicle is already in the parking
    const activeEntry = await prisma.entry.findFirst({
      where: {
        plateNumber,
        parkingCode,
        exitDateTime: null
      }
    });

    if (activeEntry) {
      return ServerResponse.conflict(res, `Vehicle with plate number '${plateNumber}' is already in the parking`);
    }

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        plateNumber,
        parkingCode,
        entryDateTime: new Date(),
        exitDateTime: null,
        chargedAmount: null
      }
    });

    // Update available spaces
    await prisma.parking.update({
      where: { code: parkingCode },
      data: {
        availableSpaces: {
          decrement: 1
        }
      }
    });

    // Generate ticket
    const ticket = {
      ticketNumber: entry.id,
      plateNumber: entry.plateNumber,
      parkingName: parking.name,
      entryDateTime: entry.entryDateTime,
      hourlyFee: parking.hourlyFee
    };

    return ServerResponse.created(res, { entry, ticket }, 'Vehicle entry registered and ticket generated successfully');
  } catch (error) {
    console.error('Register entry error:', error);
    return ServerResponse.error(res, 'Failed to register entry');
  }
};

export const registerExit = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Check if entry exists
    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        parking: true
      }
    });

    if (!entry) {
      return ServerResponse.notFound(res, `Entry with ID '${id}' not found`);
    }

    // Check if entry is already closed
    if (entry.exitDateTime) {
      return ServerResponse.conflict(res, `Entry with ID '${id}' is already closed`);
    }

    // Calculate duration and amount
    const exitDateTime = new Date();
    const entryDateTime = new Date(entry.entryDateTime);
    
    // Calculate duration in hours
    const durationInMs = exitDateTime.getTime() - entryDateTime.getTime();
    const durationInHours = Math.ceil(durationInMs / (1000 * 60 * 60));
    
    // Calculate charged amount
    const hourlyFee = entry.parking.hourlyFee;
    const chargedAmount = Number(hourlyFee) * durationInHours;

    // Update entry
    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        exitDateTime,
        chargedAmount
      },
      include: {
        parking: true
      }
    });

    // Update available spaces
    await prisma.parking.update({
      where: { code: entry.parkingCode },
      data: {
        availableSpaces: {
          increment: 1
        }
      }
    });

    // Generate bill
    const bill = {
      billNumber: updatedEntry.id,
      plateNumber: updatedEntry.plateNumber,
      parkingName: updatedEntry.parking.name,
      entryDateTime: updatedEntry.entryDateTime,
      exitDateTime: updatedEntry.exitDateTime,
      durationInHours,
      hourlyFee: updatedEntry.parking.hourlyFee,
      totalAmount: updatedEntry.chargedAmount
    };

    // Send email notification
    try {
      await sendEmail({
        to: 'customer@example.com', // In a real application, you would get the customer's email
        subject: 'Parking Payment Receipt',
        text: `Thank you for using XWYZ Parking. Your payment of $${chargedAmount} has been processed.`,
        html: `
          <h2>XWYZ Parking Receipt</h2>
          <p>Thank you for using XWYZ Parking.</p>
          <p>Details:</p>
          <ul>
            <li>Plate Number: ${updatedEntry.plateNumber}</li>
            <li>Parking: ${updatedEntry.parking.name}</li>
            <li>Entry Time: ${updatedEntry.entryDateTime}</li>
            <li>Exit Time: ${updatedEntry.exitDateTime}</li>
            <li>Duration: ${durationInHours} hours</li>
            <li>Amount: $${chargedAmount}</li>
          </ul>
        `
      });
    } catch (emailError) {
      console.error('Error sending payment receipt email:', emailError);
    }

    return ServerResponse.success(res, { entry: updatedEntry, bill }, 'Vehicle exit registered and bill generated successfully');
  } catch (error) {
    console.error('Register exit error:', error);
    return ServerResponse.error(res, 'Failed to register exit');
  }
};

export const getAllEntries = async (req: Request, res: Response): Promise<Response> => {
  try {
    const entries = await prisma.entry.findMany({
      include: {
        parking: true
      }
    });

    return ServerResponse.success(res, entries, 'Entries retrieved successfully');
  } catch (error) {
    console.error('Get all entries error:', error);
    return ServerResponse.error(res, 'Failed to retrieve entries');
  }
};

export const getActiveEntries = async (req: Request, res: Response): Promise<Response> => {
  try {
    const entries = await prisma.entry.findMany({
      where: {
        exitDateTime: null
      },
      include: {
        parking: true
      }
    });

    return ServerResponse.success(res, entries, 'Active entries retrieved successfully');
  } catch (error) {
    console.error('Get active entries error:', error);
    return ServerResponse.error(res, 'Failed to retrieve active entries');
  }
};

export const getEntryById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        parking: true
      }
    });

    if (!entry) {
      return ServerResponse.notFound(res, `Entry with ID '${id}' not found`);
    }

    return ServerResponse.success(res, entry, 'Entry retrieved successfully');
  } catch (error) {
    console.error('Get entry by ID error:', error);
    return ServerResponse.error(res, 'Failed to retrieve entry');
  }
};