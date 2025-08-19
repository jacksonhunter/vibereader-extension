# 🔥 Quick Start - Matrix Reader Extension

## Immediate Testing Steps

### 1. Load Extension in Firefox

1. Open Firefox
2. Type in address bar: `about:debugging`
3. Click **"This Firefox"** in left sidebar
4. Click **"Load Temporary Add-on..."**
5. Navigate to the extension folder
6. Select **`manifest.json`** file
7. Extension should appear with Matrix Reader icon

### 2. Test on a Website

**Good test sites:**
- Any news article (CNN, BBC, Medium, etc.)
- Blog posts 
- Wikipedia articles
- Reddit posts

**How to activate:**
1. Go to any article/blog post
2. Press **Ctrl+Shift+M** OR click the Matrix Reader icon
3. Page should transform into retrofuture interface

### 3. Test Image Preview

1. Find a webpage with images
2. Activate Matrix Reader mode
3. Hover over any image placeholder that says "HOVER TO PREVIEW"
4. Image should appear in cyberpunk-styled preview box
5. Move mouse away to hide, or press Escape

### 4. Test Theme Switching

1. While in Matrix Reader mode
2. Click **🎨 THEME** button in top-right
3. Should cycle through: Nightdrive → Neon Surge → Outrun Storm → Strange Days
4. Colors and effects should change immediately

### 5. Settings Panel

1. Click Matrix Reader extension icon in toolbar
2. Should open cyberpunk-styled popup
3. Toggle various settings (Image Preview, Terminal Panels, etc.)
4. Settings should save and apply immediately

## Expected Results

✅ **Page Transform**: Clean cyberpunk interface with terminal panels  
✅ **Image Previews**: Hover shows images with neon borders  
✅ **Theme Cycling**: 4 different color schemes  
✅ **Typography**: Retrofuture fonts and neon glows  
✅ **Responsive**: Works on mobile and desktop  

## Troubleshooting

**If extension doesn't load:**
- Make sure you selected `manifest.json` file specifically
- Check Firefox console for errors (F12)
- Try reloading Firefox

**If Matrix mode doesn't activate:**
- Try on a different article/blog post
- Check that page has readable content
- Press F12 and check console for errors

**If images don't preview:**
- Make sure "Image Preview" is enabled in settings
- Some images might be blocked by CORS
- Try different websites

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Matrix mode activates with Ctrl+Shift+M
- [ ] Page transforms to retrofuture interface
- [ ] Terminal panels show system info
- [ ] Image hover previews work
- [ ] Theme cycling works (4 different themes)
- [ ] Settings popup opens and saves preferences
- [ ] Extension can be deactivated
- [ ] Works on multiple websites
- [ ] Responsive on different screen sizes

## Files to Check

Make sure these files exist in your extension folder:
- `manifest.json` ✅
- `content.js` ✅
- `background.js` ✅
- `lib/readability.js` ✅
- `lib/image-preview.js` ✅
- `styles/retrofuture-theme.css` ✅
- `popup/popup.html` ✅
- `popup/popup.css` ✅
- `popup/popup.js` ✅

Ready to jack into the Matrix! 🔥⚡🖥️