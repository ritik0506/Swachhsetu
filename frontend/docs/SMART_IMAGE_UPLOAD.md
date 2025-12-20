# SmartImageUpload Component Documentation

## Overview
`SmartImageUpload.jsx` is a React component for civic reporting apps that provides intelligent image upload with real-time AI spam detection, automatic resizing, and drag-and-drop functionality.

---

## Features

### 🎯 Core Functionality
- ✅ **Drag-and-drop** image upload
- ✅ **Click-to-browse** file selection
- ✅ **Client-side image resizing** (max 1024px width) to save bandwidth
- ✅ **Automatic AI spam detection** via backend API
- ✅ **Real-time verification status** with visual feedback
- ✅ **Category detection** for civic issues
- ✅ **Severity scoring** (1-10 scale)

### 🎨 UI/UX Features
- 📸 **Image preview** with responsive design
- 🔄 **Loading skeleton** during verification
- ✅ **Green verified badge** for legitimate images
- ❌ **Red error overlay** for spam/invalid images
- 🌙 **Dark mode support** with Tailwind CSS
- 📱 **Mobile-responsive** design

### 🛡️ Validation
- File type validation (JPEG, PNG, GIF, WebP)
- File size validation (default: 10MB max)
- Spam detection via AI forensic analysis
- Category classification
- Severity assessment

---

## Installation

### 1. Install Dependencies
```bash
npm install lucide-react
```

### 2. Copy Component Files
Place the following files in your project:
- `src/components/SmartImageUpload.jsx`
- `src/components/ExampleReportForm.jsx` (optional - for reference)

### 3. Ensure API Utility Exists
Make sure you have `src/utils/api.js` configured for API calls.

---

## Usage

### Basic Usage

```jsx
import { useState } from 'react';
import SmartImageUpload from './components/SmartImageUpload';

function MyForm() {
  const [isVerified, setIsVerified] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const handleVerify = (result) => {
    if (result && !result.is_spam && !result.error) {
      setIsVerified(true);
      console.log('Image verified:', result);
    } else {
      setIsVerified(false);
    }
  };

  const handleChange = (file) => {
    setImageFile(file);
  };

  return (
    <SmartImageUpload
      onVerify={handleVerify}
      onChange={handleChange}
    />
  );
}
```

### Advanced Usage with Form Integration

```jsx
import { useState } from 'react';
import SmartImageUpload from './components/SmartImageUpload';

function CivicReportForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleImageVerify = (result) => {
    if (result && !result.is_spam && !result.error) {
      setIsVerified(true);
      setVerificationData(result);
      
      // Auto-fill form fields from AI detection
      if (result.civic_category && result.civic_category !== 'None') {
        setFormData(prev => ({
          ...prev,
          category: result.civic_category
        }));
      }
      
      if (result.visual_evidence) {
        setFormData(prev => ({
          ...prev,
          description: result.visual_evidence
        }));
      }
    } else {
      setIsVerified(false);
      setVerificationData(null);
    }
  };

  const handleImageChange = (file) => {
    setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isVerified || !imageFile) {
      alert('Please upload and verify an image');
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('image', imageFile);
    
    // Include AI verification data
    submitData.append('aiAnalysis', JSON.stringify({
      forensicAnalysis: verificationData
    }));

    // Make API call
    // await api.post('/api/reports', submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <SmartImageUpload
        onVerify={handleImageVerify}
        onChange={handleImageChange}
        maxWidth={1024}
        maxSizeMB={10}
      />
      
      {/* Show verification status */}
      {isVerified && (
        <div className="mt-2 text-green-600">
          ✓ Image verified as {verificationData?.civic_category}
        </div>
      )}

      {/* Other form fields */}
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
        placeholder="Title"
      />
      
      <button 
        type="submit" 
        disabled={!isVerified || !imageFile}
      >
        Submit Report
      </button>
    </form>
  );
}
```

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onVerify` | `Function` | No | - | Callback function called with verification result |
| `onChange` | `Function` | No | - | Callback function called with resized file (only if verified) |
| `maxWidth` | `Number` | No | `1024` | Maximum width for client-side image resizing (in pixels) |
| `maxSizeMB` | `Number` | No | `10` | Maximum allowed file size in megabytes |

### `onVerify` Callback Parameter

The `onVerify` function receives a verification result object:

```typescript
{
  is_spam: boolean,          // True if image is spam/invalid
  spam_reason: string | null, // Reason for spam detection (if spam)
  civic_category: string,     // Detected civic issue category
  visual_evidence: string,    // Description of what AI sees
  severity_score: number,     // Urgency score (1-10)
  confidence: number,         // AI confidence (0.0-1.0)
  error?: string             // Error message if verification failed
}
```

**Example:**
```javascript
const handleVerify = (result) => {
  console.log('Verification result:', result);
  
  if (result && !result.is_spam && !result.error) {
    // Image is legitimate
    console.log('Category:', result.civic_category);
    console.log('Severity:', result.severity_score);
    console.log('Evidence:', result.visual_evidence);
  } else if (result && result.is_spam) {
    // Image is spam
    console.log('Spam reason:', result.spam_reason);
  } else if (result && result.error) {
    // Verification error
    console.log('Error:', result.error);
  }
};
```

### `onChange` Callback Parameter

The `onChange` function receives the resized file (only called if verification succeeds):

```javascript
const handleChange = (file) => {
  if (file) {
    console.log('Resized file:', file);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);
    // Use file for submission
  } else {
    // File cleared
  }
};
```

---

## API Integration

### Backend Endpoint Required

The component calls the following API endpoint:

```http
POST /api/ai/forensic/analyze
Content-Type: multipart/form-data

Body:
- image: File (JPEG, PNG, GIF, WebP)
```

**Expected Response:**
```json
{
  "success": true,
  "is_spam": false,
  "spam_reason": null,
  "civic_category": "Pothole",
  "visual_evidence": "Deep pothole approximately 1 meter wide on main road",
  "severity_score": 7,
  "confidence": 0.92,
  "technical_metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size_mb": "2.34"
  }
}
```

### API Configuration

Ensure your `src/utils/api.js` is properly configured:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Styling

The component uses **Tailwind CSS** for styling. Ensure Tailwind is configured in your project.

### Dark Mode Support

The component automatically adapts to dark mode using Tailwind's `dark:` variant:

```jsx
// Example: Component adapts background color
<div className="bg-white dark:bg-gray-800">
```

To enable dark mode in your app:

```javascript
// In your root component or layout
<div className="dark">
  <SmartImageUpload {...props} />
</div>
```

Or use Tailwind's class-based dark mode:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // ... other config
}
```

### Custom Styling

To customize colors, modify the Tailwind classes in the component:

```jsx
// Change verified badge color (default: green)
<div className="bg-green-500"> {/* Change to bg-blue-500 */}

// Change error overlay color (default: red)
<div className="bg-red-500"> {/* Change to bg-orange-500 */}

// Change loading spinner color (default: blue)
<Loader2 className="text-blue-500" /> {/* Change to text-purple-500 */}
```

---

## Component States

### 1. Initial State (No Image)
- Shows drag-and-drop zone
- Camera icon and upload instructions
- Dashed border with hover effect

### 2. Dragging State
- Blue highlighted border
- Upload icon animation
- "Drop image here" text

### 3. Verifying State
- Image preview visible
- Semi-transparent black overlay
- Animated loading spinner
- "Scanning for Spam..." text

### 4. Verified State (Success)
- Image preview visible
- Green gradient overlay at top
- Checkmark icon with "Verified" badge
- Detected category displayed
- Confidence percentage shown
- Visual evidence at bottom
- Severity score indicator

### 5. Rejected State (Spam Detected)
- Image preview visible
- Red overlay covering entire image
- Alert icon with error message
- "Try Again" button
- Clear explanation of rejection

### 6. Error State
- Image preview visible
- Red banner at top with error message
- Clear button visible

---

## Image Processing

### Client-Side Resizing

The component automatically resizes images to save bandwidth:

1. **Maximum Width**: Default 1024px (configurable via `maxWidth` prop)
2. **Aspect Ratio**: Preserved during resizing
3. **Quality**: 90% JPEG quality
4. **Canvas-Based**: Uses HTML5 Canvas API for resizing

**Example:**
```javascript
// Original: 4000x3000 (5MB)
// Resized: 1024x768 (~500KB)
```

### Processing Flow

```
User Selects Image
        ↓
Validate File Type & Size
        ↓
Resize Image (Canvas API)
        ↓
Create Preview URL
        ↓
Call API for Verification
        ↓
Display Result (Verified/Rejected)
```

---

## Error Handling

### Client-Side Errors

1. **Invalid File Type**
   - Message: "Please select an image file (JPEG, PNG, GIF, WebP)"
   - Action: File rejected immediately

2. **File Size Too Large**
   - Message: "File size exceeds 10MB limit"
   - Action: File rejected immediately

3. **Image Processing Failed**
   - Message: "Failed to process image. Please try again."
   - Action: User can try different image

### Server-Side Errors

1. **API Request Failed**
   - Message: Custom error from API response
   - Fallback: "Failed to verify image. Please try again."
   - Action: User can retry

2. **Network Error**
   - Message: "Network error. Please check your connection."
   - Action: User can retry

---

## Accessibility

The component includes accessibility features:

1. **Keyboard Navigation**: File input is accessible via keyboard
2. **ARIA Labels**: Proper labeling for screen readers
3. **Focus States**: Visible focus indicators
4. **Color Contrast**: Meets WCAG AA standards
5. **Alt Text**: Images have descriptive alt attributes

### Improvements for Screen Readers

```jsx
<label
  htmlFor="image-upload-input"
  aria-label="Upload civic issue photo with drag and drop or click to browse"
>
```

---

## Performance Optimization

### Image Resizing Benefits
- **Bandwidth Savings**: 80-90% reduction in upload size
- **Faster Uploads**: 5-10x faster for high-res photos
- **Server Load**: Reduced processing on backend

### Lazy Loading
Preview URLs are created only when needed and cleaned up on unmount:

```javascript
useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // Cleanup
    }
  };
}, [previewUrl]);
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Drag & Drop | ✅ | ✅ | ✅ | ✅ |
| Canvas Resize | ✅ | ✅ | ✅ | ✅ |
| File API | ✅ | ✅ | ✅ | ✅ |
| FormData | ✅ | ✅ | ✅ | ✅ |

**Minimum Versions:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Troubleshooting

### Issue: Image not uploading
**Solution:** Check API endpoint configuration in `src/utils/api.js`

### Issue: "Scanning for Spam..." never completes
**Solution:** Ensure backend forensic analysis service is running

### Issue: All images marked as spam
**Solution:** Check backend AI model is loaded (LLaVA:7b)

### Issue: Images not resizing
**Solution:** Check browser console for Canvas API errors

### Issue: Dark mode not working
**Solution:** Ensure `dark` class is applied to parent element

---

## Examples

### Example 1: Simple Integration
```jsx
function SimpleForm() {
  const [verified, setVerified] = useState(false);

  return (
    <SmartImageUpload
      onVerify={(result) => {
        setVerified(result && !result.is_spam && !result.error);
      }}
    />
  );
}
```

### Example 2: With Category Auto-Fill
```jsx
function FormWithAutoFill() {
  const [category, setCategory] = useState('');

  return (
    <>
      <SmartImageUpload
        onVerify={(result) => {
          if (result && result.civic_category) {
            setCategory(result.civic_category);
          }
        }}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select category</option>
        <option value="Pothole">Pothole</option>
        <option value="Garbage Dump">Garbage Dump</option>
      </select>
    </>
  );
}
```

### Example 3: With Severity Warning
```jsx
function FormWithSeverity() {
  const [severity, setSeverity] = useState(0);

  return (
    <>
      <SmartImageUpload
        onVerify={(result) => {
          if (result && result.severity_score) {
            setSeverity(result.severity_score);
          }
        }}
      />
      {severity >= 7 && (
        <div className="text-red-600 font-bold">
          ⚠️ Critical issue detected! Requires immediate attention.
        </div>
      )}
    </>
  );
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Upload JPEG image - should resize and verify
- [ ] Upload PNG image - should resize and verify
- [ ] Upload GIF image - should verify
- [ ] Drag and drop image - should work
- [ ] Upload >10MB image - should show error
- [ ] Upload non-image file - should show error
- [ ] Upload selfie - should mark as spam
- [ ] Upload screenshot - should mark as spam
- [ ] Upload valid civic issue - should verify with category
- [ ] Clear image - should reset state
- [ ] Dark mode - should adapt styling

### Unit Testing (Jest + React Testing Library)

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SmartImageUpload from './SmartImageUpload';

test('renders upload zone', () => {
  render(<SmartImageUpload />);
  expect(screen.getByText(/Upload Civic Issue Photo/i)).toBeInTheDocument();
});

test('calls onVerify when image is verified', async () => {
  const mockOnVerify = jest.fn();
  render(<SmartImageUpload onVerify={mockOnVerify} />);
  
  // Simulate file upload
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/Upload/i);
  fireEvent.change(input, { target: { files: [file] } });
  
  await waitFor(() => {
    expect(mockOnVerify).toHaveBeenCalled();
  });
});
```

---

## License

This component is part of the SwachhSetu civic reporting platform.

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/ritik0506/Swachhsetu/issues
- Documentation: See `/backend/docs/FORENSIC_IMAGE_ANALYZER.md`

---

## Changelog

### v1.0.0 (2025-12-10)
- ✨ Initial release
- ✅ Drag-and-drop support
- ✅ Client-side resizing
- ✅ AI spam detection
- ✅ Category detection
- ✅ Dark mode support
- ✅ Mobile responsive
