import mongoose from 'mongoose';
import { SafeUser, UpdateProfileDto } from '../types/user.types.js';
import { ApiError } from '../utils/apiError.js';
import { isDatabaseConnected } from '../config/database.js';
import { UserModel } from '../models/User.js';
import { userStore } from '../db/userStore.js';

export class UserService {
  async getProfile(userId: string): Promise<SafeUser> {
    if (isDatabaseConnected()) {
      try {
        if (mongoose.isValidObjectId(userId)) {
          const user = await UserModel.findById(userId);
          if (user) {
            return user.toSafeObject();
          }
        }
      } catch (err) {
        console.warn('[UserService] DB lookup failed:', err);
      }
    }

    const storeUser = await userStore.findById(userId);
    if (!storeUser) {
      throw ApiError.notFound('User profile not found.');
    }

    return {
      id: storeUser.id,
      name: storeUser.full_name,
      email: storeUser.email,
      role: storeUser.role,
      status: storeUser.status,
      organization: storeUser.organization,
      roleTitle: storeUser.role_title,
      bio: storeUser.bio,
      phone: storeUser.phone,
      createdAt: storeUser.created_at,
      updatedAt: storeUser.updated_at,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<SafeUser> {
    // Sanitized allowed updates only (strictly ignores role, status, createdAt, email)
    const allowedUpdates: Record<string, any> = {};
    if (data.name !== undefined) allowedUpdates.name = data.name.trim();
    if (data.profileImage !== undefined) allowedUpdates.profileImage = data.profileImage;
    if (data.bio !== undefined) allowedUpdates.bio = data.bio.trim();
    if (data.organization !== undefined) allowedUpdates.organization = data.organization.trim();
    if (data.roleTitle !== undefined) allowedUpdates.roleTitle = data.roleTitle.trim();
    if (data.phone !== undefined) allowedUpdates.phone = data.phone.trim();

    if (isDatabaseConnected() && mongoose.isValidObjectId(userId)) {
      try {
        const updatedDoc = await UserModel.findByIdAndUpdate(
          userId,
          { $set: allowedUpdates },
          { new: true, runValidators: true }
        );
        if (updatedDoc) {
          return updatedDoc.toSafeObject();
        }
      } catch (err) {
        console.warn('[UserService] DB update error:', err);
      }
    }

    const storeUpdates: Record<string, any> = {};
    if (data.name !== undefined) storeUpdates.full_name = data.name.trim();
    if (data.bio !== undefined) storeUpdates.bio = data.bio.trim();
    if (data.organization !== undefined) storeUpdates.organization = data.organization.trim();
    if (data.roleTitle !== undefined) storeUpdates.role_title = data.roleTitle.trim();
    if (data.phone !== undefined) storeUpdates.phone = data.phone.trim();

    const updatedStoreUser = await userStore.update(userId, storeUpdates);
    if (!updatedStoreUser) {
      throw ApiError.notFound('User profile not found for update.');
    }

    return {
      id: updatedStoreUser.id,
      name: updatedStoreUser.full_name,
      email: updatedStoreUser.email,
      role: updatedStoreUser.role,
      status: updatedStoreUser.status,
      organization: updatedStoreUser.organization,
      roleTitle: updatedStoreUser.role_title,
      bio: updatedStoreUser.bio,
      phone: updatedStoreUser.phone,
      createdAt: updatedStoreUser.created_at,
      updatedAt: updatedStoreUser.updated_at,
    };
  }
}

export const userService = new UserService();
