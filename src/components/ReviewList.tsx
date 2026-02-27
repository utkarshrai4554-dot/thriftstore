import { useReviews } from '@/contexts/ReviewContext';
import { useAuth } from '@/hooks/useAuth';
import { Star, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

interface ReviewListProps {
  productId: string;
}

const ReviewList = ({ productId }: ReviewListProps) => {
  const { getProductReviews, deleteReview, updateReview } = useReviews();
  const { user, userProfile } = useAuth();
  const reviews = getProductReviews(productId);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/50">
        <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canDeleteReview = (review: any) => {
    // User can delete their own review
    if (user && review.userId === user.uid) {
      return true;
    }
    // Admin can delete any review
    if (userProfile?.role === 'admin') {
      return true;
    }
    return false;
  };

  const canEditReview = (review: any) => {
    // Only user can edit their own review (admin cannot edit)
    if (user && review.userId === user.uid) {
      return true;
    }
    return false;
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (reviewToDelete) {
      deleteReview(reviewToDelete);
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleSaveEdit = (reviewId: string) => {
    if (editRating === 0 || editComment.trim() === '') {
      toast.error('Rating and comment are required');
      return;
    }
    
    updateReview(reviewId, {
      rating: editRating,
      comment: editComment.trim()
    });
    
    setEditingReview(null);
    setEditRating(0);
    setEditComment('');
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditComment('');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Reviews ({reviews.length})</h3>
      
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4 bg-card">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-medium">{review.userName}</div>
              {editingReview === review.id ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 cursor-pointer ${
                            star <= editRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground hover:text-yellow-400'
                          }`}
                          onClick={() => setEditRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="Update your review..."
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    maxLength={500}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(review.id)}
                      className="bg-primary text-primary-foreground"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {review.rating}.0
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mt-2">{review.comment}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {formatDate(review.date)}
              </div>
              {editingReview !== review.id && (
                <div className="flex gap-1">
                  {canEditReview(review) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReview(review)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteReview(review) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
      />
    </div>
  );
};

export default ReviewList;
