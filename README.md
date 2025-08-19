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

### 📊 **Advanced Table Handling**
- **Complex table detection** automatically identifies large or nested tables
- **Click-to-expand placeholders** for complex tables (similar to images)
- **Original table preservation** maintains perfect formatting
- **Cyberpunk table styling** with retrofuture aesthetics
- **Simple table enhancement** for basic tables without placeholders

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

4. **Table Interaction**
   - **Complex tables** automatically show as clickable placeholders
   - **Click table placeholder** to expand and view full table
   - **Click close button** (✕) to collapse back to placeholder
   - **Simple tables** get cyberpunk styling automatically

5. **Theme Switching**
   - Click **🎨 THEME** button to cycle themes
   - Or use the popup settings panel

6. **Exit Matrix Mode**
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

### **Table Issues**
- Complex tables (>8 rows or >6 columns) automatically become placeholders
- Tables with merged cells may need manual review after expansion
- If table placeholder won't expand, try refreshing the page
- Simple tables get basic styling without placeholder functionality

### **Performance Issues**
- Disable **Matrix Rain** effect in settings
- Reduce **Terminal Panels** if on mobile device
- Switch to a lighter theme like Nightdrive Enhanced

---

## 🛠️ Technical Details

### **Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIBE READER EXTENSION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐ │
│  │  manifest.json  │    │           BACKGROUND SCRIPT          │ │
│  │                 │    │         (background.js)              │ │
│  │ • Permissions   │◄───┤                                      │ │
│  │ • Content CSP   │    │ • Extension lifecycle management     │ │
│  │ • Browser action│    │ • Tab state tracking (ON/OFF)       │ │
│  │ • Keyboard      │    │ • Message passing coordinator       │ │
│  │   shortcuts     │    │ • Browser badge updates             │ │
│  └─────────────────┘    │ • Settings persistence               │ │
│                         └──────────────────┬───────────────────┘ │
│                                           │                     │
│  ┌─────────────────────────────────────────▼─────────────────┐   │
│  │                 CONTENT SCRIPT                           │   │
│  │                (content.js - 1400+ lines)               │   │
│  │                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐ │   │
│  │  │  MatrixReader   │  │      Content Processing         │ │   │
│  │  │     Class       │  │                                 │ │   │
│  │  │                 │  │ • Readability.js integration   │ │   │
│  │  │ • Page transform│  │ • HTML parsing & cleanup       │ │   │
│  │  │ • State mgmt    │  │ • Content extraction           │ │   │
│  │  │ • UI generation │  │ • Image/video detection        │ │   │
│  │  │ • Event handling│  │ • Table complexity analysis    │ │   │
│  │  └─────────────────┘  └─────────────────────────────────┘ │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │           PLACEHOLDER SYSTEM                        │ │   │
│  │  │                                                     │ │   │
│  │  │ ┌─────────────┐    ┌─────────────────────────────┐ │ │   │
│  │  │ │   Images    │    │          Tables             │ │ │   │
│  │  │ │             │    │                             │ │ │   │
│  │  │ │ • Preview   │    │ • Complexity detection      │ │ │   │
│  │  │ │   hints     │    │   (rows, cols, nesting)     │ │ │   │
│  │  │ │ • Hover     │    │ • Click-to-expand           │ │ │   │
│  │  │ │   loading   │    │ • Original HTML preservation│ │ │   │
│  │  │ │ • Load All  │    │ • Cyberpunk styling         │ │ │   │
│  │  │ │   button    │    │ • Close/collapse            │ │ │   │
│  │  │ └─────────────┘    └─────────────────────────────┘ │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     LIBRARIES                               │ │
│  │                                                             │ │
│  │  ┌─────────────────┐    ┌─────────────────────────────────┐ │ │
│  │  │ readability.js  │    │       image-preview.js          │ │ │
│  │  │                 │    │                                 │ │ │
│  │  │ • Mozilla's     │    │ • Imagus-style hover preview   │ │ │
│  │  │   content       │    │ • Smart positioning            │ │ │
│  │  │   extraction    │    │ • Viewport bounds detection    │ │ │
│  │  │ • Article       │    │ • Keyboard navigation          │ │ │
│  │  │   parsing       │    │ • Loading states               │ │ │
│  │  │ • Clean HTML    │    │ • CORS handling                │ │ │
│  │  └─────────────────┘    └─────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   POPUP INTERFACE                           │ │
│  │              (popup.html/css/js)                            │ │
│  │                                                             │ │
│  │ • Settings panel with theme selection                      │ │
│  │ • Toggle switches for features                             │ │
│  │ • Real-time setting sync                                   │ │
│  │ • Browser storage integration                              │ │
│  │ • Reset to defaults functionality                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  THEMING SYSTEM                             │ │
│  │              (retrofuture-theme.css)                       │ │
│  │                                                             │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │ │
│  │ │ CSS Custom  │ │   Themes    │ │    Component Styles     │ │ │
│  │ │ Properties  │ │             │ │                         │ │ │
│  │ │             │ │ • Nightdrive│ │ • Terminal panels       │ │ │
│  │ │ • Colors    │ │ • Neon Surge│ │ • Control buttons       │ │ │
│  │ │ • Glows     │ │ • Outrun    │ │ • Image placeholders    │ │ │
│  │ │ • Borders   │ │   Storm     │ │ • Table placeholders    │ │ │
│  │ │ • Fonts     │ │ • Strange   │ │ • Expanded tables       │ │ │
│  │ │ • Animations│ │   Days      │ │ • Typography            │ │ │
│  │ └─────────────┘ └─────────────┘ └─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

      DATA FLOW:
      
      1. User activates extension (keyboard/icon)
      2. Background script receives activation
      3. Content script loads Readability.js
      4. Content extracted & processed
      5. Images → placeholders with hover
      6. Tables → complexity analysis → placeholders or styling
      7. Cyberpunk UI generated with current theme
      8. Settings sync'd from browser storage
      9. User interactions handled in real-time
```

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