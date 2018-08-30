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
/*
program.on('mouse', function(data) {
  if (data.action === 'mouseup') return;
  program.move(1, program.rows);
  program.eraseInLine('right');
  if (data.action === 'wheelup') {
    program.write('Mouse wheel up at: ' + data.x + ', ' + data.y);
  } else if (data.action === 'wheeldown') {
    program.write('Mouse wheel down at: ' + data.x + ', ' + data.y);
  } else if (data.action === 'mousedown' && data.button === 'left') {
    program.write('Left button down at: ' + data.x + ', ' + data.y);
  } else if (data.action === 'mousedown' && data.button === 'right') {
    program.write('Right button down at: ' + data.x + ', ' + data.y);
  } else {
    program.write('Mouse at: ' + data.x + ', ' + data.y);
  }
  program.move(data.x, data.y);
  program.bg('red');
  program.write(' ');
  program.bg('!red');
});
*/
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
    if (terminalAspectRatio > imageAspectRatio) {
      imageRenderHeight = height;
      imageRenderWidth = height * imageAspectRatio;
    } else {
      imageRenderHeight = width / imageAspectRatio;
      imageRenderWidth = width;
      isHorizontal = true;
    }
    horizontalRatio = imageWidth / imageRenderWidth;
    verticalRatio = imageHeight / imageRenderHeight;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isHorizontal && (x < (width / 4 - imageRenderWidth / 2) || x > (width / 4 + imageRenderWidth / 2))) {
          output[y * height + x] = 0;
        } else if (isHorizontal && (y < (height / 2 - imageRenderHeight / 2) || y > (height / 2 + imageRenderHeight / 2))) {
          output[y * height + x] = 0;
        } else {
          let cellValue = 0;
          for (let j = 0; j < verticalRatio; j++) {
            for (let i = 0; i < horizontalRatio; i++) {
              let color = image.getPixelColor((horizontalRatio * x | 0) + i, (verticalRatio * y | 0) + j);
              let r = (color >> 24) & 0xFF;
              let g = (color >> 16) & 0xFF;
              let b = (color >>  8) & 0xFF;
              let a = (color >>  0) & 0xFF;
              cellValue += (r + g + b) * (a / 255 / 3);
            } 
          }
          cellValue = cellValue / ((horizontalRatio + 1) | 0) / ((verticalRatio + 1) | 0);
          output[y * height + x] = cellValue >> 7;
          if ((cellValue >> 7) > 1) console.log(cellValue >> 7);
        }
      }
    }

    program.move(0,0);
    for (let y = 0; y < height; y+=4) {
      for (let x = 0; x < width; x+=2) {
        let unicodeValue = (output[y * height + x] || 0) +
          ((output[(y + 1) * height + x] || 0) << 1) +
          ((output[(y + 2) * height + x] || 0) << 2) +
          ((output[(y + 3) * height + x] || 0) << 6) +
          ((output[(y + 0) * height + x + 1] || 0) << 3) +
          ((output[(y + 1) * height + x + 1] || 0) << 4) +
          ((output[(y + 2) * height + x + 1] || 0) << 5) +
          ((output[(y + 3) * height + x + 1] || 0) << 7);
        program.write(getUnicodeValue(unicodeValue));
        // program.write(""+(x%10));
      }
      if (y + 4 < height) program.feed();
    }

  }
  if (!image || !width || !options.once) setTimeout(loop.bind(this, options), 16);
};
loop({once: true});

Jimp.read('lenna.png', (err, lenna) => {
  if (err) throw err;
  image = lenna.greyscale();
});

/*

program.move(1, 1);
program.bg('black');
program.write('Hello world', 'blue fg');
program.setx((program.cols / 2 | 0) - 4);
program.down(5);
program.write('Hi again!');
program.bg('!black');
program.feed();
program.write('Hi again!');

program.getCursor(function(err, data) {
  if (!err) {
    program.write('Cursor is at: ' + data.x + ', ' + data.y + '.');
    program.feed();
  }

  program.charset('SCLD');
  program.write('abcdefghijklmnopqrstuvwxyz0123456789');
  program.charset('US');
  program.setx(1);
});*/
