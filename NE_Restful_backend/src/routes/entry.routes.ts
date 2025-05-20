import express from 'express';
import { 
  registerEntry, 
  registerExit, 
  getAllEntries, 
  getActiveEntries, 
  getEntryById 
} from '../controllers/entry.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { body, param } from 'express-validator';
import { validateRequest } from '../middlewares/validation.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/entries:
 *   post:
 *     summary: Register a new vehicle entry
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plateNumber
 *               - parkingCode
 *             properties:
 *               plateNumber:
 *                 type: string
 *               parkingCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entry registered and ticket generated successfully
 *       400:
 *         description: Invalid input or no available spaces
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Parking not found
 *       409:
 *         description: Vehicle already in parking
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    authenticate,
    body('plateNumber').notEmpty().withMessage('Plate number is required'),
    body('parkingCode').notEmpty().withMessage('Parking code is required'),
    validateRequest
  ],
  registerEntry
);

/**
 * @swagger
 * /api/entries:
 *   get:
 *     summary: Get all entries
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of entries
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getAllEntries);

/**
 * @swagger
 * /api/entries/active:
 *   get:
 *     summary: Get active entries (vehicles currently in parking)
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active entries
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/active', authenticate, getActiveEntries);

/**
 * @swagger
 * /api/entries/{id}:
 *   get:
 *     summary: Get entry by ID
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entry details
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Entry not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  [
    authenticate,
    param('id').notEmpty().withMessage('Entry ID is required'),
    validateRequest
  ],
  getEntryById
);

/**
 * @swagger
 * /api/entries/{id}/exit:
 *   put:
 *     summary: Register vehicle exit
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exit registered and bill generated successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Entry not found
 *       409:
 *         description: Entry already closed
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/exit',
  [
    authenticate,
    param('id').notEmpty().withMessage('Entry ID is required'),
    validateRequest
  ],
  registerExit
);

export default router;