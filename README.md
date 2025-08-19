# 🔥 Matrix Reader - Retrofuture Web Extension 🔥

Transform any webpage into a **90s cyberpunk retrofuture reading experience** with **Imagus-style image previews** and classic synthwave aesthetics.

![Matrix Reader Preview](https://img.shields.io/badge/Status-Ready%20to%20Install-brightgreen?style=for-the-badge&logo=firefox&logoColor=white)

## ⚡ Features

### 🖥️ **90s Retrofuture Interface**
- **Clean reader mode** with classic cyberpunk web design
- **Terminal-style side panels** with system info and network status
- **Scanline effects** and authentic CRT monitor aesthetics
- **Four synthwave themes** (Nightdrive, Neon Surge, Outrun Storm, Strange Days)

### 📸 **Imagus-Style Image Preview**
- **Hover to preview** images instantly without clicking
- **Smart positioning** that stays within viewport bounds
- **File information** display with dimensions and filename
- **Keyboard shortcuts** (Escape to close previews)

### 🎯 **Reading Experience**
- **Readability.js integration** for clean content extraction
- **Enhanced typography** with neon glow effects
- **Responsive design** that works on all screen sizes
- **Accessibility features** with reduced motion support

### ⌨️ **Controls**
- **Ctrl+Shift+M** - Toggle Matrix Reader mode
- **Theme cycling** button for quick style changes
- **Image preview toggle** for performance control
- **Quick disconnect** to return to normal web

---

## 🚀 Installation Instructions

### **Firefox Installation**

#### **Method 1: Load Temporary Add-on (Recommended for Testing)**

1. **Open Firefox Developer Tools**
   ```
   Navigate to: about:debugging
   ```

2. **Load Extension**
   - Click **"This Firefox"** in the left sidebar
   - Click **"Load Temporary Add-on..."** button
   - Navigate to the extension folder and select **`manifest.json`**

3. **Extension Loaded!**
   - Matrix Reader icon should appear in your toolbar
   - Badge will show "ON" when active on a page

#### **Method 2: Permanent Installation (Advanced)**

1. **Package Extension**
   ```bash
   # Navigate to extension directory
   cd matrix-reader-extension
   
   # Create zip file
   zip -r matrix-reader.xpi * -x "*.DS_Store" "*.git*" "README.md"
   ```

2. **Install XPI File**
   ```
   Navigate to: about:addons
   Click gear icon → "Install Add-on From File..."
   Select the matrix-reader.xpi file
   ```

---

## 🎮 How to Use

### **Basic Usage**

1. **Activate Matrix Reader**
   - Click the **⚡ Matrix Reader** icon in toolbar, OR
   - Press **Ctrl+Shift+M** on any webpage

2. **Enjoy the Retrofuture Experience**
   - Page transforms into 90s cyberpunk interface
   - Left panel shows system information
   - Right panel shows network status
   - Main content area displays clean, readable text

3. **Image Previews**
   - **Hover over any image** for instant preview
   - **Move cursor away** to hide preview
   - **Press Escape** to force close preview

4. **Theme Switching**
   - Click **🎨 THEME** button to cycle themes
   - Or use the popup settings panel

5. **Exit Matrix Mode**
   - Click **⚡ DISCONNECT** button, OR
   - Press **Ctrl+Shift+M** again

### **Settings Panel**

Click the Matrix Reader icon to open settings:

- **🎭 Visual Theme** - Choose from 4 synthwave aesthetics
- **📸 Image Preview** - Toggle Imagus-style hover previews  
- **📜 Terminal Panels** - Show/hide side information panels
- **🌧️ Matrix Rain** - Optional background digital rain effect
- **🚀 Auto-Activate** - Automatically transform pages on load

---

## 🎨 Themes Available

### **1. Nightdrive Enhanced** (Default)
- **Colors:** Classic neon pink and electric cyan
- **Vibe:** Classic synthwave with improved readability
- **Best for:** Long reading sessions

### **2. Neon Surge**  
- **Colors:** Electric pink and pure blue on black
- **Vibe:** High-contrast Blade Runner aesthetic
- **Best for:** Maximum cyberpunk immersion

### **3. Outrun Storm**
- **Colors:** Storm purple and sunset orange
- **Vibe:** Dramatic weather synthwave
- **Best for:** Dynamic, energetic reading

### **4. Strange Days**
- **Colors:** Phantom pink and lime green
- **Vibe:** Underground cyberpunk aesthetic  
- **Best for:** Unique, experimental look

---

## 🔧 Troubleshooting

### **Extension Not Loading**
- Ensure you selected the **`manifest.json`** file, not the folder
- Check browser console for errors (F12 → Console)
- Try refreshing the page after loading extension

### **Matrix Mode Won't Activate**
- Check if the page has readable content (articles, blog posts work best)
- Some pages may block content extraction for security
- Try the keyboard shortcut **Ctrl+Shift+M**

### **Image Previews Not Working**
- Ensure **Image Preview** is enabled in settings
- Some images may be blocked by CORS policies
- Check that images have supported formats (jpg, png, gif, webp)

### **Performance Issues**
- Disable **Matrix Rain** effect in settings
- Reduce **Terminal Panels** if on mobile device
- Switch to a lighter theme like Nightdrive Enhanced

---

## 🛠️ Technical Details

### **Architecture**
- **Content Script**: Main functionality and UI transformation
- **Background Script**: Extension lifecycle and browser integration  
- **Popup Interface**: Settings and quick controls
- **CSS Themes**: Modular synthwave aesthetic system

### **Libraries Used**
- **Readability.js** - Mozilla's content extraction library
- **Custom Image Preview** - Imagus-inspired hover preview system
- **CSS Grid & Flexbox** - Responsive retrofuture layout

### **Browser Compatibility**
- ✅ **Firefox 88+** (Manifest V2)
- ⚠️ **Chrome** (would need Manifest V3 conversion)
- ⚠️ **Safari** (would need additional modifications)

### **File Structure**
```
matrix-reader-extension/
├── manifest.json              # Extension configuration
├── content.js                 # Main content transformation
├── background.js              # Extension lifecycle
├── lib/
│   ├── readability.js         # Content extraction
│   └── image-preview.js       # Imagus-style previews
├── styles/
│   └── retrofuture-theme.css  # 90s cyberpunk aesthetics
├── popup/
│   ├── popup.html            # Settings interface
│   ├── popup.css             # Popup styling
│   └── popup.js              # Settings functionality
└── icons/                    # Extension icons (add your own)
```

---

## 🎯 Future Enhancements

- [ ] **ASCII Art Mode** - Convert images to text art
- [ ] **Terminal Commands** - Interactive command system
- [ ] **Sound Effects** - Optional cyberpunk audio feedback
- [ ] **Custom Themes** - User-created color schemes
- [ ] **Export Mode** - Save transformed content
- [ ] **Chrome Support** - Manifest V3 conversion

---

## 🔥 Credits

**Developed with love for cyberpunk enthusiasts**

- **Inspiration**: Classic 90s web design, Blade Runner, The Matrix
- **Color Schemes**: Based on synthwave and outrun aesthetics  
- **Typography**: VT323, Share Tech Mono, Orbitron fonts
- **Image Preview**: Inspired by the amazing Imagus extension

---

## ⚡ Quick Start

1. **Load extension** in Firefox (about:debugging)
2. **Visit any article** or blog post
3. **Press Ctrl+Shift+M** or click toolbar icon
4. **Enter the Matrix** and enjoy retrofuture reading!

**Welcome to the future of web reading. Jack in and disconnect from the ordinary web.**

🔗 **[Report Issues](https://github.com/your-repo/matrix-reader/issues)** | 🌟 **[Rate Extension](https://addons.mozilla.org)** | 📖 **[Documentation](https://github.com/your-repo/matrix-reader/wiki)**