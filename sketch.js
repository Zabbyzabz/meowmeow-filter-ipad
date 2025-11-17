let vid, overlayImg, catEarsImg, randomButtonImg, capture;
let faceapi, faceapiReady = false;
let detections = [];
let ml5Loaded = false;
let prevDetected = 0;
let detectionPersistence = 15;

// Y2K settings
let pixelSize = 4;
let colorSteps = 16;
let contrastBoost = 1.3;
let saturationBoost = 1.5;
let brightnessBoost = 1.2;  // Increased from 1.0 to 1.2 for higher exposure

let posterizeEnabled = false;
let posterizeLevels = 4;
let overlayPixelSize = 2;
let webcamZoom = 1.0;

// Halftone settings
let halftoneEnabled = false;
let halftoneSize = 4;
let halftoneSpacing = 8;

// Button feedback
let buttonPressed = false;
let buttonPressFrame = 0;

// Random button settings
let buttonWidth = 78;
let buttonHeight = 78;
let buttonY = 0; // Will be calculated in setup based on canvas height

const DITHER = [[0, 2], [3, 1]];

// NICO NICO STYLE CAT KAOMOJI COMMENTS
let comments = [];
const CAT_KAOMOJIS = [
  '(=^･ω･^=)', '(=^‥^=)', '(=；ェ；=)', 'ฅ^•ﻌ•^ฅ', '(^･o･^)ﾉ"',
  'ଲ(ⓛ ω ⓛ)ଲ', '(^._.^)ﾉ', '(=`ω´=)', '(=^･ｪ･^=)', '₍˄·͈༝·͈˄₎◞ ̑̑ෆ⃛',
  '(ↀДↀ)', '(ㅇㅅㅇ❀)', 'ㅇㅅㅇ', '(=ටᆼට=)', '(=ｘェｘ=)', '~(=^‥^)/',
  '(๑˃̵ᴗ˂̵)و', 'ଲ(ⓛ ω ⓛ)ଲ', '(｡•́︿•̀｡)'
];

// Fullscreen button state
let fullscreenBtn;
let isFullscreen = false;

function preload() {
  vid = createVideo('video.mp4', () => {
    vid.hide();
    vid.loop();
    vid.volume(0);
  });
  
  vid.elt.addEventListener('error', (e) => {
    console.warn('Video failed to load, continuing without it');
    vid = null;
  });
  
  overlayImg = loadImage('overlay.png', 
    () => {},
    () => console.warn('Overlay not found')
  );
  
  catEarsImg = loadImage('cat-ears.png', 
    () => {},
    () => console.warn('Cat ears not found')
  );
  
  randomButtonImg = loadImage('button.png',
    () => {},
    () => console.warn('Button not found')
  );
}

function setup() {
  // Larger canvas size - 1.45x bigger (500 * 1.45 = 725)
  let canvasSize = 725;
  
  // Canvas positioned center-left
  let canvas = createCanvas(canvasSize, canvasSize);
  canvas.position(100, 50); // More margin from edges
  pixelDensity(1);
  frameRate(60);
  
  console.log('Canvas created');
  
  capture = createCapture(VIDEO, () => {
    console.log('Webcam ready');
  });
  capture.size(width, height); // Use canvas dimensions
  capture.hide();
  
  // Set button position relative to canvas height
  buttonY = height - 38; // 38px from bottom
  
  textFont('monospace');
  textAlign(CENTER, CENTER);
  
  // Black background for entire page
  document.body.style.background = '#000';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  
  // Create fullscreen button
  createFullscreenButton();
  
  // Start face detection only after everything else is ready
  setTimeout(() => {
    checkML5();
  }, 2000);
  
  // Start comments after delay
  setTimeout(() => {
    setInterval(spawnComment, random(2000, 4000));
  }, 3000);
}

function createFullscreenButton() {
  fullscreenBtn = createButton('×');
  fullscreenBtn.position(windowWidth - 30, 5);
  fullscreenBtn.style('padding', '2px 8px');
  fullscreenBtn.style('font-size', '20px');
  fullscreenBtn.style('line-height', '1');
  fullscreenBtn.style('background', 'rgba(0, 0, 0, 0.1)');
  fullscreenBtn.style('color', 'rgba(255, 255, 255, 0.3)');
  fullscreenBtn.style('border', 'none');
  fullscreenBtn.style('cursor', 'pointer');
  fullscreenBtn.style('font-family', 'arial');
  fullscreenBtn.style('border-radius', '2px');
  fullscreenBtn.mousePressed(toggleFullscreen);
  fullscreenBtn.touchStarted(() => {
    toggleFullscreen();
    return false;
  });
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  isFullscreen = !fs;
}

function checkML5() {
  if (typeof ml5 !== 'undefined') {
    ml5Loaded = true;
    console.log('ml5 found, starting face detection');
    try {
      startFaceDetection();
    } catch(e) {
      console.error('Face detection failed:', e);
    }
  } else {
    console.log('ml5 not ready yet');
    setTimeout(checkML5, 1000);
  }
}

function spawnComment() {
  let comment = {
    text: random(CAT_KAOMOJIS),
    x: width + 100,
    y: random(50, height - 100),
    speed: random(2, 5),
    size: random(20, 35),
    color: color(random(200, 255), random(200, 255), random(200, 255))
  };
  comments.push(comment);
}

function startFaceDetection() {
  const options = { 
    withLandmarks: true, 
    withDescriptors: false, 
    minConfidence: 0.05
  };
  
  faceapi = ml5.faceApi(capture, options, () => {
    faceapiReady = true;
    detectFaces();
  });
}

function detectFaces() {
  if (!faceapiReady) return;
  
  faceapi.detect((err, results) => {
    if (!err) {
      if (results && results.length > 0) {
        detections = results;
        prevDetected = detectionPersistence;
      } else if (prevDetected > 0) {
        prevDetected--;
      } else {
        detections = [];
      }
    }
    setTimeout(detectFaces, 33);
  });
}

function draw() {
  background(255);
  
  // Show loading message if webcam not ready
  if (!capture || !capture.loadedmetadata) {
    push();
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text('Loading webcam...', width/2, height/2);
    pop();
    return;
  }
  
  // LAYER 1: Y2K glitchy digital style
  try {
    drawY2KStyle();
  } catch(e) {
    console.error('Y2K style error:', e);
  }
  
  // LAYER 1.5: Halftone effect (if enabled)
  if (halftoneEnabled) {
    try {
      drawHalftone();
    } catch(e) {
      console.error('Halftone error:', e);
    }
  }
  
  // LAYER 2: Flashing overlay (when face detected)
  if (detections.length > 0 && overlayImg && overlayImg.width > 0) {
    try {
      let flashInterval = 30;
      let showOverlay = floor(frameCount / flashInterval) % 2 === 0;
      if (showOverlay) {
        if (frameCount % 2 === 0 || !window.cachedOverlay) {
          let pg = createGraphics(width, height);
          pg.image(overlayImg, 0, 0, width, height);
          pg.loadPixels();
          
          let pixelatedOverlay = createGraphics(width, height);
          pixelatedOverlay.noSmooth();
          pixelatedOverlay.noStroke();
          
          for (let y = 0; y < height; y += overlayPixelSize) {
            for (let x = 0; x < width; x += overlayPixelSize) {
              let index = (floor(y) * width + floor(x)) * 4;
              let r = pg.pixels[index];
              let g = pg.pixels[index + 1];
              let b = pg.pixels[index + 2];
              let a = pg.pixels[index + 3];
              
              pixelatedOverlay.fill(r, g, b, a);
              pixelatedOverlay.rect(x, y, overlayPixelSize, overlayPixelSize);
            }
          }
          
          if (window.cachedOverlay) window.cachedOverlay.remove();
          window.cachedOverlay = pixelatedOverlay;
          pg.remove();
        }
        
        if (window.cachedOverlay) {
          image(window.cachedOverlay, 0, 0, width, height);
        }
      }
    } catch(e) {
      console.error('Overlay error:', e);
    }
  }
  
  // LAYER 3: Cat ears (when face detected)
  if (faceapiReady && detections.length > 0) {
    try {
      drawCatEars();
    } catch(e) {
      console.error('Cat ears error:', e);
    }
  }
  
  // LAYER 4: Video frame with transparency
  if (vid && vid.loadedmetadata) {
    try {
      drawVideoFrame();
    } catch(e) {
      console.error('Video frame error:', e);
    }
  }
  
  // LAYER 5: Nico Nico style comments
  try {
    drawComments();
  } catch(e) {
    console.error('Comments error:', e);
  }
  
  // LAYER 6: Random button (bottom center)
  if (randomButtonImg && randomButtonImg.width > 0) {
    try {
      drawRandomButton();
    } catch(e) {
      console.error('Button error:', e);
    }
  }
}

function drawY2KStyle() {
  if (!capture || !capture.loadedmetadata) {
    push();
    fill(200);
    textSize(16);
    text('Waiting for webcam...', width/2, height/2);
    pop();
    return;
  }
  
  capture.loadPixels();
  if (!capture.pixels || !capture.pixels.length) return;
  
  noStroke();
  
  let capW = capture.width;
  let capH = capture.height;
  let scaleX = capW / width;
  let scaleY = capH / height;
  let steps = posterizeEnabled ? posterizeLevels : colorSteps;
  let stepSize = 255 / (steps - 1);
  
  for (let y = 0; y < height; y += pixelSize) {
    let cy = (y * scaleY) | 0;
    
    for (let x = 0; x < width; x += pixelSize) {
      let mirrorX = width - x - pixelSize;
      let cx = (mirrorX * scaleX) | 0;
      
      let zoomCX = ((cx - capW / 2) / webcamZoom + capW / 2) | 0;
      let zoomCY = ((cy - capH / 2) / webcamZoom + capH / 2) | 0;
      
      if (zoomCX < 0 || zoomCX >= capW || zoomCY < 0 || zoomCY >= capH) {
        fill(0);
        rect(x, y, pixelSize, pixelSize);
        continue;
      }
      
      let capIdx = (zoomCY * capW + zoomCX) * 4;
      let r = capture.pixels[capIdx];
      let g = capture.pixels[capIdx + 1];
      let b = capture.pixels[capIdx + 2];
      
      // Saturation boost
      let gray = (r + g + b) * 0.333;
      r = gray + (r - gray) * saturationBoost;
      g = gray + (g - gray) * saturationBoost;
      b = gray + (b - gray) * saturationBoost;
      
      // Brightness & Contrast
      r = ((r * brightnessBoost) - 128) * contrastBoost + 128;
      g = ((g * brightnessBoost) - 128) * contrastBoost + 128;
      b = ((b * brightnessBoost) - 128) * contrastBoost + 128;
      
      // Dithering
      let ditherVal = ((x + y) & pixelSize) ? 8 : -8;
      r += ditherVal;
      g += ditherVal;
      b += ditherVal;
      
      // Quantize
      r = ((r / stepSize + 0.5) | 0) * stepSize;
      g = ((g / stepSize + 0.5) | 0) * stepSize;
      b = ((b / stepSize + 0.5) | 0) * stepSize;
      
      // Clamp
      r = r < 0 ? 0 : r > 255 ? 255 : r;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;
      
      fill(r, g, b);
      rect(x, y, pixelSize, pixelSize);
    }
  }
}

function drawComments() {
  push();
  textAlign(LEFT, CENTER);
  
  for (let i = comments.length - 1; i >= 0; i--) {
    let c = comments[i];
    c.x -= c.speed;
    
    if (c.x < -200) {
      comments.splice(i, 1);
      continue;
    }
    
    let hideComment = false;
    if (detections.length > 0) {
      for (let d of detections) {
        if (!d.alignedRect) continue;
        
        const box = d.alignedRect._box;
        const scaleX = width / capture.width;
        const scaleY = height / capture.height;
        
        const faceRight = width - (box._x * scaleX);
        const faceLeft = width - ((box._x + box._width) * scaleX);
        const faceTop = box._y * scaleY;
        const faceBottom = (box._y + box._height) * scaleY;
        
        if (c.x > faceLeft && c.x < faceRight &&
            c.y > faceTop && c.y < faceBottom) {
          hideComment = true;
          break;
        }
      }
    }
    
    if (!hideComment) {
      fill(c.color);
      textSize(c.size);
      text(c.text, c.x, c.y);
    }
  }
  
  pop();
}

function drawVideoFrame() {
  if (!vid || !vid.loadedmetadata) return;
  
  vid.loadPixels();
  if (!vid.pixels || !vid.pixels.length) return;
  
  push();
  let pg = createGraphics(vid.width, vid.height);
  pg.image(vid, 0, 0);
  pg.loadPixels();
  
  const threshold = 30;
  for (let i = 0; i < pg.pixels.length; i += 4) {
    let brightness = (pg.pixels[i] + pg.pixels[i + 1] + pg.pixels[i + 2]) / 3;
    if (brightness < threshold) {
      pg.pixels[i + 3] = 0;
    }
  }
  
  pg.updatePixels();
  image(pg, 0, 0, width, height);
  pg.remove();
  pop();
}

function drawCatEars() {
  push();
  
  for (let d of detections) {
    if (!d.alignedRect) continue;
    
    const box = d.alignedRect._box;
    const scaleX = width / capture.width;
    const scaleY = height / capture.height;
    
    const centerX = width - (box._x * scaleX + (box._width * scaleX) / 2);
    const topY = box._y * scaleY;
    const faceWidth = box._width * scaleX;
    
    const earsWidth = faceWidth * 1.7;
    const earsHeight = catEarsImg ? earsWidth * (catEarsImg.height / catEarsImg.width) : earsWidth;
    
    // PROPORTIONAL POSITIONING - scales with face distance
    const earsX = centerX + (faceWidth * 0.35);  // ← Adjust multiplier (currently 0.35)
    const earsY = topY - earsHeight * 0.8;  // ← Adjust Y multiplier (currently 0.8)
    
    if (catEarsImg && catEarsImg.width > 0) {
      imageMode(CENTER);
      tint(255, 255);
      image(catEarsImg, earsX, earsY, earsWidth, earsHeight);
      noTint();
    }
    
    // DEBUG: Green face detection box
    noFill();
    stroke(0, 255, 0);
    strokeWeight(3);
    const mirroredX = width - ((box._x + box._width) * scaleX);
    const rectY = box._y * scaleY;
    rect(mirroredX, rectY, box._width * scaleX, box._height * scaleY);
  }  
  pop();
}

function drawRandomButton() {
  push();
  imageMode(CENTER);
  let buttonX = width / 2;
  
  // DEBUG: Draw hit area
  noFill();
  stroke(255, 0, 0, 100);
  strokeWeight(2);
  rectMode(CENTER);
  rect(buttonX, buttonY, buttonWidth * 1.5, buttonHeight * 1.5);
  
  // Visual feedback when pressed
  if (buttonPressed && frameCount - buttonPressFrame < 10) {
    tint(255, 200);
    image(randomButtonImg, buttonX, buttonY, buttonWidth * 0.95, buttonHeight * 0.95);
  } else {
    noTint();
    image(randomButtonImg, buttonX, buttonY, buttonWidth, buttonHeight);
  }
  
  // DEBUG: Show touch text (closer to button)
  fill(255);
  noStroke();
  textSize(10);
  textAlign(CENTER);
  text('touch here', buttonX, buttonY + 10);  // Locked at +10
  
  pop();
}

function mousePressed() {
  checkRandomButtonClick();
  return false;
}

function touchStarted() {
  // iPad/mobile touch support
  // Force update mouseX/mouseY for touch events
  if (touches.length > 0) {
    mouseX = touches[0].x;
    mouseY = touches[0].y;
  }
  
  checkRandomButtonClick();
  return false; // Prevent default
}

function touchEnded() {
  return false; // Prevent default
}

function checkRandomButtonClick() {
  // Check if click/touch is on the random button
  if (randomButtonImg && randomButtonImg.width > 0) {
    let buttonX = width / 2;
    let halfWidth = (buttonWidth * 1.5) / 2;  // 1.5x larger hit area
    let halfHeight = (buttonHeight * 1.5) / 2;
    
    // Get the actual mouse/touch position relative to canvas
    let canvasX = mouseX;
    let canvasY = mouseY;
    
    if (canvasX > buttonX - halfWidth && canvasX < buttonX + halfWidth &&
        canvasY > buttonY - halfHeight && canvasY < buttonY + halfHeight) {
      randomizeEffects();
      return true;
    }
  }
  return false;
}

function drawHalftone() {
  loadPixels();
  let pg = createGraphics(width, height);
  pg.background(255);
  
  for (let y = 0; y < height; y += halftoneSpacing) {
    for (let x = 0; x < width; x += halftoneSpacing) {
      let index = (y * width + x) * 4;
      let r = pixels[index];
      let g = pixels[index + 1];
      let b = pixels[index + 2];
      
      // CMYK-style color halftone
      let cyan = 255 - r;
      let magenta = 255 - g;
      let yellow = 255 - b;
      
      // Cyan dots
      let cyanSize = map(cyan, 0, 255, 0, halftoneSize);
      pg.fill(0, 255, 255);
      pg.noStroke();
      pg.ellipse(x + halftoneSpacing * 0.25, y + halftoneSpacing * 0.25, cyanSize, cyanSize);
      
      // Magenta dots
      let magentaSize = map(magenta, 0, 255, 0, halftoneSize);
      pg.fill(255, 0, 255);
      pg.ellipse(x + halftoneSpacing * 0.75, y + halftoneSpacing * 0.25, magentaSize, magentaSize);
      
      // Yellow dots
      let yellowSize = map(yellow, 0, 255, 0, halftoneSize);
      pg.fill(255, 255, 0);
      pg.ellipse(x + halftoneSpacing * 0.5, y + halftoneSpacing * 0.75, yellowSize, yellowSize);
    }
  }
  
  blendMode(MULTIPLY);
  image(pg, 0, 0);
  blendMode(BLEND);
  pg.remove();
}

function randomizeEffects() {
  // Visual feedback
  buttonPressed = true;
  buttonPressFrame = frameCount;
  
  // Randomize color settings - SOFTER, less saturated like the reference images
  brightnessBoost = random(1.1, 1.5);  // INCREASED for higher exposure (was 0.95-1.3)
  saturationBoost = random(0.9, 1.8);   // REDUCED - can even desaturate (0.9) or boost gently
  contrastBoost = random(1.0, 1.6);     // More subtle contrast
  
  // Randomize pixelation - FULL RANGE as requested
  pixelSize = floor(random(1, 9));  // 1-8 range (random gives 1-8.99, floor makes it 1-8)
  overlayPixelSize = floor(random(2, 6));  // Keep overlay moderate for performance
  
  // Posterize: 50% chance, limited levels as requested
  posterizeEnabled = random() > 0.5;
  if (posterizeEnabled) {
    posterizeLevels = floor(random(4, 11));  // 4-10 range as requested
  }
  
  // Halftone: 30% chance (less common since it's heavy)
  halftoneEnabled = random() > 0.7;
  if (halftoneEnabled) {
    halftoneSize = floor(random(3, 7));      // Dot size: 3-6
    halftoneSpacing = floor(random(6, 12));  // Spacing: 6-11
  }
}
