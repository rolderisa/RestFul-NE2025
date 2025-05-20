import express from 'express';
import { 
  createParking, 
  getAllParkings, 
  getParkingByCode, 
  updateParking, 
  deleteParking,
  getAvailableParkings
} from '../controllers/parking.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';
import { body, param } from 'express-validator';
import { validateRequest } from '../middlewares/validation.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/parkings:
 *   post:
 *     summary: Create a new parking
 *     tags: [Parkings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - totalSpaces
 *               - location
 *               - hourlyFee
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               totalSpaces:
 *                 type: integer
 *               location:
 *                 type: string
 *               hourlyFee:
 *                 type: number
 *     responses:
 *       201:
 *         description: Parking created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       409:
 *         description: Parking already exists
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    authenticate,
    authorizeAdmin,
    body('code').notEmpty().withMessage('Parking code is required'),
    body('name').notEmpty().withMessage('Parking name is required'),
    body('totalSpaces').isInt({ min: 1 }).withMessage('Total spaces must be a positive integer'),
    body('location').notEmpty().withMessage('Location is required'),
    body('hourlyFee').isFloat({ min: 0 }).withMessage('Hourly fee must be a positive number'),
    validateRequest
  ],
  createParking
);

/**
 * @swagger
 * /api/parkings:
 *   get:
 *     summary: Get all parkings
 *     tags: [Parkings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parkings
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getAllParkings);

/**
 * @swagger
 * /api/parkings/available:
 *   get:
 *     summary: Get parkings with available spaces
 *     tags: [Parkings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parkings with available spaces
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/available', authenticate, getAvailableParkings);

/**
 * @swagger
 * /api/parkings/{code}:
 *   get:
 *     summary: Get parking by code
 *     tags: [Parkings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parking details
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Parking not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:code',
  [
    authenticate,
    param('code').notEmpty().withMessage('Parking code is required'),
    validateRequest
  ],
  getParkingByCode
);

/**
 * @swagger
 * /api/parkings/{code}:
 *   put:
 *     summary: Update parking
 *     tags: [Parkings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               totalSpaces:
 *                 type: integer
 *               location:
 *                 type: string
 *               hourlyFee:
 *                 type: number
 *     responses:
 *       200:
 *         description: Parking updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Parking not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:code',
  [
    authenticate,
    authorizeAdmin,
    param('code').notEmpty().withMessage('Parking code is required'),
    body('name').optional(),
    body('totalSpaces').optional().isInt({ min: 1 }).withMessage('Total spaces must be a positive integer'),
    body('location').optional(),
    body('hourlyFee').optional().isFloat({ min: 0 }).withMessage('Hourly fee must be a positive number'),
    validateRequest
  ],
  updateParking
);

/**
 * @swagger
 * /api/parkings/{code}:
 *   delete:
 *     summary: Delete parking
 *     tags: [Parkings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parking deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Parking not found
 *       409:
 *         description: Parking has active entries
 *       500:
 *         description: Server error
 */
router.delete(
  '/:code',
  [
    authenticate,
    authorizeAdmin,
    param('code').notEmpty().withMessage('Parking code is required'),
    validateRequest
  ],
  deleteParking
);

export default router;