import express from 'express';
import { 
  getOutgoingCarsByDateRange, 
  getIncomingCarsByDateRange, 
  getParkingOccupancyReport,
  getRevenueReport,
  generateEntriesReport
} from '../controllers/report.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';
import { query } from 'express-validator';
import { validateRequest } from '../middlewares/validation.middleware';
import { body, param } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * /api/reports/outgoing:
 *   get:
 *     summary: Get report of outgoing cars in a date range
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Outgoing cars report generated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get(
  '/outgoing',
  [
    authenticate,
    authorizeAdmin,
    query('startDate').notEmpty().withMessage('Start date is required'),
    query('endDate').notEmpty().withMessage('End date is required'),
    validateRequest
  ],
  getOutgoingCarsByDateRange
);

/**
 * @swagger
 * /api/reports/incoming:
 *   get:
 *     summary: Get report of incoming cars in a date range
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Incoming cars report generated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get(
  '/incoming',
  [
    authenticate,
    authorizeAdmin,
    query('startDate').notEmpty().withMessage('Start date is required'),
    query('endDate').notEmpty().withMessage('End date is required'),
    validateRequest
  ],
  getIncomingCarsByDateRange
);

/**
 * @swagger
 * /api/reports/occupancy:
 *   get:
 *     summary: Get parking occupancy report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parking occupancy report generated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get(
  '/occupancy',
  [
    authenticate,
    authorizeAdmin
  ],
  getParkingOccupancyReport
);

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: groupBy
 *         required: false
 *         schema:
 *           type: string
 *           enum: [parking, day]
 *         description: Group results by parking or day
 *     responses:
 *       200:
 *         description: Revenue report generated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get(
  '/revenue',
  [
    authenticate,
    authorizeAdmin,
    query('startDate').notEmpty().withMessage('Start date is required'),
    query('endDate').notEmpty().withMessage('End date is required'),
    query('groupBy').optional().isIn(['parking', 'day']).withMessage('Group by must be either parking or day'),
    validateRequest
  ],
  getRevenueReport
);



/**
 * @swagger
 * /api/reports/entries:
 *   get:
 *     summary: Generate entries report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2025-05-13"
 *         description: Start date of the report period
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2025-05-20"
 *         description: End date of the report period
 *     responses:
 *       200:
 *         description: Entries report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       plateNumber:
 *                         type: string
 *                       parkingName:
 *                         type: string
 *                       entryDateTime:
 *                         type: string
 *                         format: date-time
 *                       exitDateTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       chargedAmount:
 *                         type: number
 *                         nullable: true
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid date range or missing start/end date
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get(
  '/entries',
  [
    authenticate,
    authorizeAdmin,
    query('startDate').notEmpty().isDate().withMessage('Valid start date is required'),
    query('endDate').notEmpty().isDate().withMessage('Valid end date is required'),
    validateRequest
  ],
  generateEntriesReport
);


export default router;