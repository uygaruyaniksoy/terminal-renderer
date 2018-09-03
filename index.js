/**
 * bit positions
 * 0 3
 * 1 4
 * 2 5
 * 6 7
 */
function getUnicodeValue(value) {
  if (value < 16) return unescape('%u280' + value.toString(16));
  return unescape('%u28' + value.toString(16));
}

var Jimp = require('jimp');
var blessed = require('blessed');
var program = blessed.program();

process.title = 'blessed';

program.on('keypress', function(ch, key) {
  if (key.name === 'q') {
    program.clear();
    program.disableMouse();
    program.showCursor();
    program.normalBuffer();
    process.exit(0);
  }
});

program.alternateBuffer();
program.hideCursor();
program.clear();

let width, height, image;

program.getWindowSize(function() {
  width = arguments[1].width * 2;
  height = arguments[1].height * 4;
});

// main loop
const loop = function (options) {

  if (image && width) {
    let imageWidth = image.bitmap.width;
    let imageHeight = image.bitmap.height;

    let terminalAspectRatio = width / height;
    let imageAspectRatio = imageWidth / imageHeight;

    let output = [];

    let imageRenderHeight;
    let imageRenderWidth;
    let horizontalRatio;
    let verticalRatio;
    let isHorizontal = false;
    let leftOffset;
    let topOffset;
    if (terminalAspectRatio > imageAspectRatio) {
      imageRenderHeight = height;
      imageRenderWidth = height * imageAspectRatio;
      leftOffset = width / 2 - imageRenderWidth / 2;
    } else {
      imageRenderHeight = width / imageAspectRatio;
      imageRenderWidth = width;
      isHorizontal = true;
      topOffset = height / 2 - imageRenderHeight / 2;
    }
    horizontalRatio = imageWidth / imageRenderWidth;
    verticalRatio = imageHeight / imageRenderHeight;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isHorizontal && (x < leftOffset || x > (width - leftOffset))) {
          output[y * width + x] = 0;
        } else if (isHorizontal && (y < topOffset || y > (height - topOffset))) {
          output[y * width + x] = 0;
        } else {
          let cellValue = 0;
          for (let j = 0; j < verticalRatio; j++) {
            for (let i = 0; i < horizontalRatio; i++) {
              let color;
              if (isHorizontal) {
                color = image.getPixelColor((horizontalRatio * x | 0) + i, (verticalRatio * (y - topOffset) | 0) + j);
              } else {
                color = image.getPixelColor((horizontalRatio * (x - leftOffset) | 0) + i, (verticalRatio * y | 0) + j);
              }
              let r = (color >> 24) & 0xFF;
              let g = (color >> 16) & 0xFF;
              let b = (color >>  8) & 0xFF;
              let a = (color >>  0) & 0xFF;
              cellValue += (r + g + b) * (a / 255 / 3);
            }
          }
          cellValue = cellValue / ((horizontalRatio + 1) | 0) / ((verticalRatio + 1) | 0);
          output[y * width + x] = cellValue >> 7;
        }
      }
    }

    program.clear();
    for (let y = 0; y < height; y+=4) {
      for (let x = 0; x < width; x+=2) {
        program.move(x / 2, y / 4);
        let unicodeValue = (output[y * width + x] || 0) +
          ((output[(y + 1) * width + x] || 0) << 1) +
          ((output[(y + 2) * width + x] || 0) << 2) +
          ((output[(y + 3) * width + x] || 0) << 6) +
          ((output[(y + 0) * width + x + 1] || 0) << 3) +
          ((output[(y + 1) * width + x + 1] || 0) << 4) +
          ((output[(y + 2) * width + x + 1] || 0) << 5) +
          ((output[(y + 3) * width + x + 1] || 0) << 7);
        program.write(getUnicodeValue(unicodeValue));
      }
    }

  }
  if (!image || !width || !options.once) setTimeout(loop.bind(this, options), 16);
};
loop({once: true});

Jimp.read('lenna.png', (err, lenna) => {
  if (err) throw err;
  image = lenna.greyscale();
});
