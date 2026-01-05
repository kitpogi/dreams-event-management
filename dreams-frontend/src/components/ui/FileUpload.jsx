import { useState, useRef } from 'react';
import { Upload, X, File, FileText, Image, Video, Music, FileCheck } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * FileUpload - File upload component with preview
 * 
 * @param {Object} props
 * @param {Function} props.onFileChange - Callback when file changes
 * @param {File|Array} props.value - Current file(s)
 * @param {Boolean} props.multiple - Allow multiple files
 * @param {String} props.accept - Accepted file types (e.g., "image/*,application/pdf")
 * @param {Number} props.maxSize - Max file size in bytes
 * @param {Number} props.maxFiles - Max number of files (when multiple)
 * @param {String} props.label - Label text
 * @param {String} props.description - Description text
 * @param {Boolean} props.showPreview - Show file preview
 * @param {String} props.className - Additional CSS classes
 */
const FileUpload = ({
  onFileChange,
  value = null,
  multiple = false,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  label = 'Upload File',
  description,
  showPreview = true,
  className,
  disabled = false,
  error,
}) => {
  const [files, setFiles] = useState(() => {
    if (value) {
      return Array.isArray(value) ? value : [value];
    }
    return [];
  });
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const getFileIcon = (file) => {
    const type = file.type || '';
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const validationErrors = [];

    if (maxSize && file.size > maxSize) {
      validationErrors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`);
    }

    return validationErrors;
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    const allErrors = [];
    const validFiles = [];

    // Check max files limit
    if (multiple) {
      const totalFiles = files.length + fileArray.length;
      if (totalFiles > maxFiles) {
        allErrors.push(`Maximum ${maxFiles} files allowed`);
        setErrors(allErrors);
        return;
      }
    } else {
      if (fileArray.length > 1) {
        allErrors.push('Only one file allowed');
        setErrors(allErrors);
        return;
      }
    }

    // Validate each file
    fileArray.forEach((file) => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        allErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });

    if (allErrors.length > 0) {
      setErrors(allErrors);
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      setErrors([]);
      onFileChange?.(multiple ? updatedFiles : updatedFiles[0]);
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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFileChange?.(multiple ? updatedFiles : updatedFiles[0] || null);
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
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <Upload
            className={cn(
              'h-10 w-10 mb-4',
              dragActive ? 'text-primary' : 'text-gray-400'
            )}
          />
          <p className="text-sm font-medium mb-1">
            {dragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-gray-500 mb-4">or</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            disabled={disabled}
          >
            Browse Files
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
        <p className="text-sm text-destructive">
          {error || errors.join(', ')}
        </p>
      )}

      {showPreview && files.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium">Uploaded Files:</p>
          <div className="grid grid-cols-1 gap-2">
            {files.map((file, index) => {
              const Icon = getFileIcon(file);
              const previewUrl = file.type?.startsWith('image/')
                ? URL.createObjectURL(file)
                : null;

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded">
                      <Icon className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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

export default FileUpload;

