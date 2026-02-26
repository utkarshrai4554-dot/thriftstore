import { useReviews } from '@/contexts/ReviewContext';
import { Star } from 'lucide-react';

interface ReviewListProps {
  productId: string;
}

const ReviewList = ({ productId }: ReviewListProps) => {
  const { getProductReviews } = useReviews();
  const reviews = getProductReviews(productId);

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

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Reviews ({reviews.length})</h3>
      
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4 bg-card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-medium">{review.userName}</div>
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
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(review.date)}
            </div>
          </div>
          
          <p className="text-sm leading-relaxed">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
