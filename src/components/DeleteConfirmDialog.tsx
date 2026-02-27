import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Review",
  message = "Are you sure you want to delete this review? This action cannot be undone."
}: DeleteConfirmDialogProps) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className={`w-full max-w-md mx-4 ${
        theme === 'dark' 
          ? 'bg-card border-border' 
          : 'bg-white border-gray-200'
      }`}>
        <CardHeader className="text-center pb-4">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            theme === 'dark' 
              ? 'bg-destructive/20' 
              : 'bg-red-50'
          }`}>
            <Trash2 className={`h-6 w-6 ${
              theme === 'dark' 
                ? 'text-destructive' 
                : 'text-red-600'
            }`} />
          </div>
          <CardTitle className={`text-xl font-semibold ${
            theme === 'dark' 
              ? 'text-card-foreground' 
              : 'text-gray-900'
          }`}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className={`text-sm ${
            theme === 'dark' 
              ? 'text-muted-foreground' 
              : 'text-gray-600'
          }`}>
            {message}
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className={`flex-1 ${
                theme === 'dark'
                  ? 'border-warm text-warm-foreground hover:bg-warm/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${
                theme === 'dark'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteConfirmDialog;
