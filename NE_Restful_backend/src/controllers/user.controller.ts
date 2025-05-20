import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import ServerResponse from '../utils/response';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return ServerResponse.success(res, users, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get all users error:', error);
    return ServerResponse.error(res, 'Failed to retrieve users');
  }
};

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return ServerResponse.notFound(res, 'User not found');
    }

    return ServerResponse.success(res, user, 'User retrieved successfully');
  } catch (error) {
    console.error('Get user by ID error:', error);
    return ServerResponse.error(res, 'Failed to retrieve user');
  }
};

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return ServerResponse.notFound(res, 'User not found');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        email: email || existingUser.email,
        role: role || existingUser.role
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return ServerResponse.success(res, updatedUser, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    return ServerResponse.error(res, 'Failed to update user');
  }
};

export const changePassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return ServerResponse.notFound(res, 'User not found');
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return ServerResponse.badRequest(res, 'Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    return ServerResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return ServerResponse.error(res, 'Failed to change password');
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return ServerResponse.notFound(res, 'User not found');
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    return ServerResponse.success(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return ServerResponse.error(res, 'Failed to delete user');
  }
};