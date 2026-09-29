import { isDatabaseConnected } from '../config/database.js';
import { CommentModel } from '../models/Comment.js';
import { commentStore } from '../db/commentStore.js';
import { IVerificationComment, IVerificationCommentReply, CommentTagType } from '../types/verification.types.js';

export interface CreateCommentInput {
  verificationId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  avatarUrl?: string;
  content: string;
  tag?: CommentTagType;
  sourceUrl?: string;
}

export class CommentService {
  /**
   * Get all comments for a verification dossier
   */
  async getCommentsByVerificationId(verificationId: string): Promise<IVerificationComment[]> {
    if (!verificationId) return [];

    if (isDatabaseConnected()) {
      try {
        const docs = await CommentModel.find({ verificationId })
          .sort({ createdAt: -1 })
          .lean();

        if (docs && docs.length > 0) {
          return docs.map((doc: any) => ({
            id: doc._id?.toString() || doc.id,
            verificationId: doc.verificationId,
            userId: doc.userId,
            userName: doc.userName,
            userEmail: doc.userEmail,
            userRole: doc.userRole,
            avatarUrl: doc.avatarUrl,
            content: doc.content,
            tag: doc.tag,
            sourceUrl: doc.sourceUrl,
            sourceDomain: doc.sourceDomain,
            likes: doc.likes || [],
            likesCount: doc.likesCount || (doc.likes ? doc.likes.length : 0),
            replies: doc.replies || [],
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          }));
        }
      } catch (err) {
        console.warn('[CommentService] DB error fetching comments, falling back to memory store:', err);
      }
    }

    return commentStore.findByVerificationId(verificationId);
  }

  /**
   * Add a new comment to a verification result
   */
  async addComment(input: CreateCommentInput): Promise<IVerificationComment> {
    const trimmedContent = input.content.trim();
    if (!trimmedContent) {
      throw new Error('Comment content cannot be empty.');
    }

    let sourceDomain = '';
    if (input.sourceUrl) {
      try {
        const urlObj = new URL(
          input.sourceUrl.startsWith('http') ? input.sourceUrl : `https://${input.sourceUrl}`
        );
        sourceDomain = urlObj.hostname.replace(/^www\./, '');
      } catch {
        sourceDomain = input.sourceUrl;
      }
    }

    const commentData: IVerificationComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      verificationId: input.verificationId,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      userRole: input.userRole || 'COMMUNITY',
      avatarUrl: input.avatarUrl,
      content: trimmedContent,
      tag: input.tag || 'GENERAL_DISCUSSION',
      sourceUrl: input.sourceUrl?.trim(),
      sourceDomain,
      likes: [],
      likesCount: 0,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDatabaseConnected()) {
      try {
        const createdDoc = await CommentModel.create({
          verificationId: commentData.verificationId,
          userId: commentData.userId,
          userName: commentData.userName,
          userEmail: commentData.userEmail,
          userRole: commentData.userRole,
          avatarUrl: commentData.avatarUrl,
          content: commentData.content,
          tag: commentData.tag,
          sourceUrl: commentData.sourceUrl,
          sourceDomain: commentData.sourceDomain,
          likes: [],
          likesCount: 0,
          replies: [],
        });

        commentData.id = createdDoc._id?.toString() || commentData.id;
      } catch (err) {
        console.warn('[CommentService] DB error saving comment, fallback to memory store:', err);
      }
    }

    // Always keep store updated for fallback consistency
    return commentStore.create(commentData);
  }

  /**
   * Toggle like on a comment
   */
  async toggleLike(commentId: string, userId: string): Promise<IVerificationComment | null> {
    if (isDatabaseConnected()) {
      try {
        const doc = await CommentModel.findById(commentId);
        if (doc) {
          const likesSet = new Set(doc.likes || []);
          if (likesSet.has(userId)) {
            likesSet.delete(userId);
          } else {
            likesSet.add(userId);
          }
          doc.likes = Array.from(likesSet);
          doc.likesCount = doc.likes.length;
          await doc.save();

          return {
            id: doc._id?.toString() || doc.id,
            verificationId: doc.verificationId,
            userId: doc.userId,
            userName: doc.userName,
            userEmail: doc.userEmail,
            userRole: doc.userRole,
            avatarUrl: doc.avatarUrl,
            content: doc.content,
            tag: doc.tag,
            sourceUrl: doc.sourceUrl,
            sourceDomain: doc.sourceDomain,
            likes: doc.likes,
            likesCount: doc.likesCount,
            replies: doc.replies as any,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
        }
      } catch (err) {
        console.warn('[CommentService] DB error toggling like:', err);
      }
    }

    return commentStore.toggleLike(commentId, userId);
  }

  /**
   * Add a reply to an existing comment
   */
  async addReply(
    commentId: string,
    reply: Omit<IVerificationCommentReply, 'id' | 'createdAt'>
  ): Promise<IVerificationComment | null> {
    const trimmedContent = reply.content.trim();
    if (!trimmedContent) {
      throw new Error('Reply content cannot be empty.');
    }

    const newReplyItem: IVerificationCommentReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      commentId,
      userId: reply.userId,
      userName: reply.userName,
      userEmail: reply.userEmail,
      userRole: reply.userRole || 'COMMUNITY',
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };

    if (isDatabaseConnected()) {
      try {
        const doc = await CommentModel.findById(commentId);
        if (doc) {
          doc.replies.push(newReplyItem as any);
          await doc.save();

          return {
            id: doc._id?.toString() || doc.id,
            verificationId: doc.verificationId,
            userId: doc.userId,
            userName: doc.userName,
            userEmail: doc.userEmail,
            userRole: doc.userRole,
            avatarUrl: doc.avatarUrl,
            content: doc.content,
            tag: doc.tag,
            sourceUrl: doc.sourceUrl,
            sourceDomain: doc.sourceDomain,
            likes: doc.likes || [],
            likesCount: doc.likesCount || 0,
            replies: doc.replies as any,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
        }
      } catch (err) {
        console.warn('[CommentService] DB error adding reply:', err);
      }
    }

    return commentStore.addReply(commentId, reply);
  }

  /**
   * Delete a comment by ID
   */
  async deleteComment(commentId: string, userId: string, isAdmin = false): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        const doc = await CommentModel.findById(commentId);
        if (doc) {
          if (doc.userId === userId || isAdmin) {
            await CommentModel.findByIdAndDelete(commentId);
            await commentStore.delete(commentId);
            return true;
          } else {
            throw new Error('Unauthorized: You can only delete your own comments.');
          }
        }
      } catch (err) {
        console.warn('[CommentService] DB error deleting comment:', err);
      }
    }

    const memComment = await commentStore.findById(commentId);
    if (memComment) {
      if (memComment.userId === userId || isAdmin) {
        return commentStore.delete(commentId);
      }
      throw new Error('Unauthorized: You can only delete your own comments.');
    }
    return false;
  }
}

export const commentService = new CommentService();
