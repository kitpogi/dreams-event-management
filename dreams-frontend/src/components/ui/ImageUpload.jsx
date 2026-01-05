import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * ImageUpload - Image upload component with drag & drop
 * 
 * @param {Object} props
 * @param {Function} props.onImageChange - Callback when image changes
 * @param {File|Array} props.value - Current image(s)
 * @param {Boolean} props.multiple - Allow multiple images
 * @param {Number} props.maxSize - Max file size in bytes
 * @param {Number} props.maxImages - Max number of images (when multiple)
 * @param {String} props.label - Label text
 * @param {String} props.description - Description text
 * @param {String} props.className - Additional CSS classes
 * @param {Array} props.acceptedFormats - Accepted image formats (default: ['image/jpeg', 'image/png', 'image/webp'])
 */
const ImageUpload = ({
  onImageChange,
  value = null,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxImages = 5,
  label = 'Upload Image',
  description,
  className,
  disabled = false,
  error,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  aspectRatio,
  minWidth,
  minHeight,
}) => {
  const [images, setImages] = useState(() => {
    if (value) {
      return Array.isArray(value) ? value : [value];
    }
    return [];
  });
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateImage = async (file) => {
    const validationErrors = [];

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      validationErrors.push(
        `${file.name} is not a valid image format. Accepted: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`
      );
      return validationErrors;
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      validationErrors.push(
        `${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`
      );
      return validationErrors;
    }

    // Check image dimensions if specified
    if (minWidth || minHeight) {
      try {
        const dimensions = await getImageDimensions(file);
        if (minWidth && dimensions.width < minWidth) {
          validationErrors.push(
            `${file.name} width must be at least ${minWidth}px (current: ${dimensions.width}px)`
          );
        }
        if (minHeight && dimensions.height < minHeight) {
          validationErrors.push(
            `${file.name} height must be at least ${minHeight}px (current: ${dimensions.height}px)`
          );
        }
      } catch (err) {
        validationErrors.push(`Could not read image dimensions for ${file.name}`);
      }
    }

    return validationErrors;
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImages = async (newFiles) => {
    const fileArray = Array.from(newFiles);
    const allErrors = [];
    const validFiles = [];
    const newPreviews = [];

    // Check max images limit
    if (multiple) {
      const totalImages = images.length + fileArray.length;
      if (totalImages > maxImages) {
        allErrors.push(`Maximum ${maxImages} images allowed`);
        setErrors(allErrors);
        return;
      }
    } else {
      if (fileArray.length > 1) {
        allErrors.push('Only one image allowed');
        setErrors(allErrors);
        return;
      }
    }

    // Validate each image
    for (const file of fileArray) {
      const fileErrors = await validateImage(file);
      if (fileErrors.length > 0) {
        allErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }

    if (allErrors.length > 0) {
      setErrors(allErrors);
    }

    if (validFiles.length > 0) {
      const updatedImages = multiple ? [...images, ...validFiles] : validFiles;
      const updatedPreviews = multiple ? [...previews, ...newPreviews] : newPreviews;
      
      setImages(updatedImages);
      setPreviews(updatedPreviews);
      setErrors([]);
      onImageChange?.(multiple ? updatedImages : updatedImages[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImages(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImages(e.target.files);
    }
  };

  const removeImage = (index) => {
    // Revoke preview URL
    if (previews[index] && previews[index].startsWith('blob:')) {
      URL.revokeObjectURL(previews[index]);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    
    setImages(updatedImages);
    setPreviews(updatedPreviews);
    onImageChange?.(multiple ? updatedImages : updatedImages[0] || null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive && 'border-primary bg-primary/5',
          error && 'border-destructive',
          disabled && 'opacity-50 cursor-not-allowed',
          !dragActive && !error && 'border-gray-300 hover:border-gray-400'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={acceptedFormats.join(',')}
          onChange={handleChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <ImageIcon
            className={cn(
              'h-10 w-10 mb-4',
              dragActive ? 'text-primary' : 'text-gray-400'
            )}
          />
          <p className="text-sm font-medium mb-1">
            {dragActive ? 'Drop images here' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-gray-500 mb-4">or</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            disabled={disabled}
          >
            Browse Images
          </Button>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
          {maxSize && (
            <p className="text-xs text-gray-400 mt-1">
              Max size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>
      </div>

      {(errors.length > 0 || error) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error || errors.join(', ')}</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium">Uploaded Images:</p>
          <div
            className={cn(
              'grid gap-4',
              multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
            )}
          >
            {images.map((image, index) => {
              const previewUrl = previews[index];

              return (
                <div
                  key={index}
                  className="relative group border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
                  style={aspectRatio ? { aspectRatio } : {}}
                >
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!disabled && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeImage(index)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  {image.name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                      {image.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

