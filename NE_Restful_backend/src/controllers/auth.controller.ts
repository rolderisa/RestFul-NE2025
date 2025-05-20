import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import ServerResponse from '../utils/response';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return ServerResponse.conflict(res, 'User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'USER'
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to XWYZ Parking Management System',
        text: `Hello ${firstName}, your account has been created successfully.`,
        html: `<p>Hello ${firstName},</p><p>Your account has been created successfully.</p>`
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    return ServerResponse.created(res, userWithoutPassword, 'User registered successfully');

  } catch (error) {
    console.error('Register error:', error);
    return ServerResponse.error(res, 'Failed to register user');
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return ServerResponse.unauthorized(res, 'Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return ServerResponse.unauthorized(res, 'Invalid email or password');
    }


          const token = jwt.sign({ id: user.id, role: user.role , email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1d' });


    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ServerResponse.success(res, { user: userWithoutPassword, token }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return ServerResponse.error(res, 'Failed to login');
  }
};

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return ServerResponse.unauthorized(res, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return ServerResponse.notFound(res, 'User not found');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ServerResponse.success(res, userWithoutPassword, 'User profile retrieved successfully');

  } catch (error) {
    console.error('Get profile error:', error);
    return ServerResponse.error(res, 'Failed to get user profile');
  }
};