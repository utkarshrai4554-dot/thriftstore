import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import AddressInput from '@/components/AddressInput';

const SellItem = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: '',
    color: '',
    size: '',
    condition: 'Good',
    sellingPrice: '',
    description: '',
    images: []
  });

  const [address, setAddress] = useState({
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const [errors, setErrors] = useState({});

  const categories = [
    'Shirts', 'T-Shirts', 'Hoodies', 'Jeans', 'Pants', 'Dresses', 
    'Skirts', 'Shoes', 'Sneakers', 'Accessories', 'Jackets', 'Coats'
  ];

  const conditions = ['Like New', 'Good', 'Worn'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Selling price must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!address.streetAddress || !address.city || !address.state || !address.postalCode) {
      newErrors.address = 'Please fill in all required address fields';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Check file count (max 5 images)
    if (uploadedImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Check file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }

    setLoading(true);
    const storage = getStorage();
    const newImages = [];

    try {
      for (const file of files) {
        const imageId = uuidv4();
        const storageRef = ref(storage, `products/${auth.currentUser.uid}/${imageId}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        newImages.push({
          id: imageId,
          url: downloadURL,
          name: file.name,
          file: file
        });
      }

      setUploadedImages(prev => [...prev, ...newImages]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages.map(img => img.url)]
      }));
      
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((url, index) => {
        const image = uploadedImages[index];
        return image && image.id !== imageId;
      })
    }));
    
    if (errors.images) {
      setErrors(prev => ({
        ...prev,
        images: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Please login to sell items');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const userPrice = parseFloat(formData.sellingPrice);
      const productData = {
        ...formData,
        sellerId: auth.currentUser.uid,
        // Use user's entered price for both original and selling price
        originalPrice: userPrice,
        sellingPrice: userPrice,
        images: uploadedImages.map(img => img.url),
        address: address.fullAddress || '',
        addressDetails: address
      };

      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      toast.success('Product listed successfully! It will be visible after admin approval.');
      
      // Reset form
      setFormData({
        title: '',
        brand: '',
        category: '',
        color: '',
        size: '',
        condition: 'Good',
        sellingPrice: '',
        description: '',
        images: []
      });
      setUploadedImages([]);
      setErrors({});
      setAddress({
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Navigate to seller products
      setTimeout(() => {
        navigate('/seller/products');
      }, 2000);

    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to list product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sell Your Item</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product title"
              maxLength={100}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.brand ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter brand name"
              maxLength={50}
            />
            {errors.brand && (
              <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Color and Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Black, Blue, Red"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select size</option>
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹) *
            </label>
            <input
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.sellingPrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your selling price"
              min="0"
              step="0.01"
              required
            />
            {errors.sellingPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.sellingPrice}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">This will be used as both original and selling price</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your item (condition, features, etc.)"
              rows={4}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />
            <p className="text-gray-500 text-sm mt-1">
              Upload up to 5 images (max 5MB each)
            </p>
            {errors.images && (
              <p className="text-red-500 text-sm mt-1">{errors.images}</p>
            )}

            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-32 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Address Input */}
          <div>
            <AddressInput
              onAddressChange={(addr) => setAddress(addr)}
              required={true}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Listing...' : 'List Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellItem;
