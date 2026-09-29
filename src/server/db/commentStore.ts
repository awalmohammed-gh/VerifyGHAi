import { IVerificationComment, IVerificationCommentReply } from '../types/verification.types.js';

class CommentStore {
  private comments: Map<string, IVerificationComment> = new Map();

  constructor() {
    // Clean initial store: all comments and evidence discussions originate from real user reviews
  }

  public async findByVerificationId(verificationId: string): Promise<IVerificationComment[]> {
    if (!verificationId) return [];
    const normalized = verificationId.toString().trim();
    return Array.from(this.comments.values())
      .filter((c) => c.verificationId === normalized || c.verificationId === verificationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async findById(id: string): Promise<IVerificationComment | null> {
    if (!id) return null;
    const direct = this.comments.get(id);
    if (direct) return { ...direct };
    for (const item of this.comments.values()) {
      if (item.id === id || (item as any)._id?.toString() === id) {
        return { ...item };
      }
    }
    return null;
  }

  public async create(comment: IVerificationComment): Promise<IVerificationComment> {
    const item: IVerificationComment = {
      ...comment,
      id: comment.id || `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      likes: comment.likes || [],
      likesCount: comment.likes ? comment.likes.length : 0,
      replies: comment.replies || [],
      createdAt: comment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.comments.set(item.id, item);
    return { ...item };
  }

  public async toggleLike(commentId: string, userId: string): Promise<IVerificationComment | null> {
    const comment = await this.findById(commentId);
    if (!comment) return null;

    const likesSet = new Set(comment.likes || []);
    if (likesSet.has(userId)) {
      likesSet.delete(userId);
    } else {
      likesSet.add(userId);
    }

    const updatedLikes = Array.from(likesSet);
    comment.likes = updatedLikes;
    comment.likesCount = updatedLikes.length;
    comment.updatedAt = new Date().toISOString();

    this.comments.set(comment.id, comment);
    return { ...comment };
  }

  public async addReply(
    commentId: string,
    reply: Omit<IVerificationCommentReply, 'id' | 'createdAt'>
  ): Promise<IVerificationComment | null> {
    const comment = await this.findById(commentId);
    if (!comment) return null;

    const newReply: IVerificationCommentReply = {
      ...reply,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    comment.replies = [...(comment.replies || []), newReply];
    comment.updatedAt = new Date().toISOString();
    this.comments.set(comment.id, comment);
    return { ...comment };
  }

  public async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (existing) {
      return this.comments.delete(existing.id);
    }
    return false;
  }
}

export const commentStore = new CommentStore();
