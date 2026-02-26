import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/contexts/ReviewContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, User } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  productName: string;
}

const ReviewForm = ({ productId, productName }: ReviewFormProps) => {
  const { user } = useAuth();
  const { addReview } = useReviews();
  const { theme } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0 || comment.trim() === '') {
      return;
    }

    setIsSubmitting(true);
    
    try {
      addReview({
        productId,
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous User',
        rating,
        comment: comment.trim(),
      });
      
      // Reset form
      setRating(0);
      setComment('');
      setShowForm(false);
    } catch (error) {
      console.error('Error adding review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="font-semibold text-lg mb-2">Share Your Experience</h3>
          <p className="text-muted-foreground mb-4">
            {user ? 'Help others by sharing your experience with this product' : 'Login to share your review with the community'}
          </p>
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full"
            size="lg"
          >
            {user ? 'Write a Review' : 'Login to Review'}
          </Button>
          {!user && (
            <p className="text-xs text-muted-foreground mt-2">
              Reviews are visible to all users and help build trust in our community
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Write a Review for {productName}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>
      
      {!user && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg text-center">
          <User className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You're reviewing as <span className="font-medium">Anonymous User</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Login to personalize your review
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium mb-2">Rating *</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-colors"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoveredStar || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              You rated this {rating} star{rating > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Your Review *
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product... What did you like? What could be improved?"
            className={`w-full min-h-[120px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              theme === 'dark' ? 'text-dark-brown' : 'text-black'
            }`}
            maxLength={500}
            style={{
              color: theme === 'dark' ? 'hsl(var(--dark-brown))' : 'black'
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={rating === 0 || comment.trim() === '' || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Your review will be visible to all users immediately
        </p>
      </form>
    </div>
  );
};

export default ReviewForm;
