// === PHOTOBOOTH - Y2K GLITCH DIGITAL AESTHETIC ===
// iPad Installation Version - Optimized for gallery projection

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
let brightnessBoost = 1.0;

let posterizeEnabled = false;
let posterizeLevels = 4;
let overlayPixelSize = 2;
let webcamZoom = 1.0;

// Random button settings
let buttonWidth = 68;
let buttonHeight = 68;
let buttonY = 610;

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
  
  vid.elt.addEventListener('error', () => {
    vid = null;
  });
  
  overlayImg = loadImage('overlay.png');
  catEarsImg = loadImage('cat-ears.png');
  randomButtonImg = loadImage('button.png');
}

function setup() {
  // Left-aligned canvas with margin
  let canvas = createCanvas(640, 640);
  canvas.position(80, 0); // 80px margin from left edge
  pixelDensity(1);
  frameRate(60);
  
  capture = createCapture(VIDEO);
  capture.size(640, 640);
  capture.hide();
  
  checkML5();
  
  textFont('monospace');
  textAlign(CENTER, CENTER);
  
  setInterval(spawnComment, random(2000, 4000));
  
  // Black background for entire page
  document.body.style.background = '#000';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  
  // Hide p5.js default fullscreen button
  let fsButton = document.querySelector('.p5-fullscreen-button');
  if (fsButton) fsButton.style.display = 'none';
  
  // Create fullscreen button
  createFullscreenButton();
}

function createFullscreenButton() {
  fullscreenBtn = createButton('⛶');
  fullscreenBtn.position(5, 5);
  fullscreenBtn.style('padding', '4px 8px');
  fullscreenBtn.style('font-size', '12px');
  fullscreenBtn.style('background', 'rgba(0, 0, 0, 0.3)');
  fullscreenBtn.style('color', 'rgba(255, 255, 255, 0.4)');
  fullscreenBtn.style('border', '1px solid rgba(255, 255, 255, 0.2)');
  fullscreenBtn.style('cursor', 'pointer');
  fullscreenBtn.style('font-family', 'monospace');
  fullscreenBtn.style('border-radius', '3px');
  fullscreenBtn.style('transition', 'opacity 0.3s');
  fullscreenBtn.mouseOver(() => fullscreenBtn.style('opacity', '1'));
  fullscreenBtn.mouseOut(() => fullscreenBtn.style('opacity', '0.5'));
  fullscreenBtn.style('opacity', '0.5');
  fullscreenBtn.mousePressed(toggleFullscreen);
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  isFullscreen = !fs;
}

function checkML5() {
  if (typeof ml5 !== 'undefined') {
    ml5Loaded = true;
    startFaceDetection();
  } else {
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
  
  // LAYER 1: Y2K glitchy digital style
  drawY2KStyle();
  
  // LAYER 2: Flashing overlay (when face detected)
  if (detections.length > 0 && overlayImg) {
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
  }
  
  // LAYER 3: Cat ears (when face detected)
  if (faceapiReady && detections.length > 0) {
    drawCatEars();
  }
  
  // LAYER 4: Video frame with transparency
  if (vid && vid.loadedmetadata) {
    drawVideoFrame();
  }
  
  // LAYER 5: Nico Nico style comments
  drawComments();
  
  // LAYER 6: Random button (bottom center)
  if (randomButtonImg) {
    drawRandomButton();
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
    
    const earsWidth = faceWidth * 2.2;
    const earsHeight = catEarsImg ? earsWidth * (catEarsImg.height / catEarsImg.width) : earsWidth;
    
    const earsX = centerX + 70;
    const earsY = topY - earsHeight * 0.8;
    
    if (catEarsImg && catEarsImg.width > 0) {
      imageMode(CENTER);
      tint(255, 255);
      image(catEarsImg, earsX, earsY, earsWidth, earsHeight);
      noTint();
    }
  }  
  pop();
}

function drawRandomButton() {
  push();
  imageMode(CENTER);
  let buttonX = width / 2;
  image(randomButtonImg, buttonX, buttonY, buttonWidth, buttonHeight);
  pop();
}

function mousePressed() {
  // Check if click is on the random button
  if (randomButtonImg) {
    let buttonX = width / 2;
    let halfWidth = buttonWidth / 2;
    let halfHeight = buttonHeight / 2;
    
    if (mouseX > buttonX - halfWidth && mouseX < buttonX + halfWidth &&
        mouseY > buttonY - halfHeight && mouseY < buttonY + halfHeight) {
      randomizeEffects();
    }
  }
}

function randomizeEffects() {
  // Randomize color settings
  brightnessBoost = random(0.8, 1.8);
  saturationBoost = random(1.0, 3.0);
  contrastBoost = random(1.0, 2.5);
  
  // Randomize pixelation
  pixelSize = floor(random(1, 8));
  overlayPixelSize = floor(random(1, 8));
  
  // Randomly enable posterize
  posterizeEnabled = random() > 0.5;
  if (posterizeEnabled) {
    posterizeLevels = floor(random(2, 12));
  }
}
