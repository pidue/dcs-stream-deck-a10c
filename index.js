const streamDeckApi = require('stream-deck-api');
const DcsBiosApi = require('dcs-bios-api');
const path = require('path');
const robot = require('robotjs');
const Jimp = require('jimp')

const IMAGE_FOLDER = './images/';
const ICON_SIZE = 72

const _textCache = {}

var currentPage;

var api = new DcsBiosApi({ logLevel: 'INFO' });
var streamDeck = streamDeckApi.getStreamDeck();
api.startListening();

process.on('SIGINT', () => {
  streamDeck.reset();
  api.stopListening();
  process.exit();
});

streamDeck.reset();

var a10cPages = {
  MAIN: {
    1: {
      view: { type: 'page_label', text: 'MAIN', page: 'MAIN', fontSize: 16 },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'page_label', text: 'NMSP', page: 'NMSP', fontSize: 16 },
      action: { type: 'page', page: 'NMSP' }
    },
    11: {
      view: { type: 'state_image', input: 'ANTI_SKID_SWITCH', states: { '0': 'AP_B_off.png', '1': 'AP_B_on.png' } },
      action: { type: 'cycle_state', output: 'ANTI_SKID_SWITCH', values: ['0', '1'] }
    },
    12: {
      view: { type: 'state_label', text: 'LIGHTS', input: 'LANDING_LIGHTS', states: { '0': 'TAXI', '1': 'OFF', '2': 'LAND' } },
      action: { type: 'cycle_state', output: 'LANDING_LIGHTS', values: ['0', '1', '2'] }
    },
    13: {
      view: { type: 'led_label', text: 'ANTI SKID', input: 'ANTI_SKID_SWITCH' },
      action: { type: 'cycle_state', output: 'ANTI_SKID_SWITCH', values: ['0', '1'] }
    },
    15: {
      view: { type: 'led_label', text: 'MASTER CAUTION', input: 'MASTER_CAUTION', onColor: 0xFFA50000 },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
        
    
  },
  NMSP: {
    1: {
      view: { type: 'page_label', text: 'MAIN', page: 'MAIN' },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'page_label', text: 'NMSP', page: 'NMSP' },
      action: { type: 'page', page: 'NMSP' }
    },
    6: {
      view: { type: 'state_image', input: 'NMSP_HARS_LED', states: { '0': 'nmsp_hars_off.png', '1': 'nmsp_hars_on.png' }},
      action: { type: 'push_button', output: 'NMSP_HARS_BTN' }
    },
    8: {
      view: { type: 'state_image', input: 'NMSP_EGI_LED', states: { '0': 'nmsp_egi_off.png', '1': 'nmsp_egi_on.png' }},
      action: { type: 'push_button', output: 'NMSP_EGI_BTN' }
    },  
    9: {
      view: { type: 'state_image', input: 'NMSP_TISL_LED', states: { '0': 'nmsp_tisl_off.png', '1': 'nmsp_tisl_on.png' }},
      action: { type: 'push_button', output: 'NMSP_TIS_BTN' }
    },     
    11: {
      view: { type: 'state_image', input: 'NMSP_STEERPT_LED', states: { '0': 'nmsp_steerpt_off.png', '1': 'nmsp_steerpt_on.png' }},
      action: { type: 'push_button', output: 'NMSP_STEERPT_BTN' }
    },     
    12: {
      view: { type: 'state_image', input: 'NMSP_ANCHR_LED', states: { '0': 'nmsp_anchr_off.png', '1': 'nmsp_anchr_on.png' }},
      action: { type: 'push_button', output: 'NMSP_ANCHR_BTN' }
    },     
    13: {
      view: { type: 'state_image', input: 'NMSP_TCN_LED', states: { '0': 'nmsp_tcn_off.png', '1': 'nmsp_tcn_on.png' }},
      action: { type: 'push_button', output: 'NMSP_TCN_BTN' }
    },     
    14: {
      view: { type: 'state_image', input: 'NMSP_ILS_LED', states: { '0': 'nmsp_ils_off.png', '1': 'nmsp_ils_on.png' }},
      action: { type: 'push_button', output: 'NMSP_ILS_BTN' }
    }, 
  }

};

// map aircraft name => pages
var aircraftPages = {
  'A-10C': a10cPages
} 

// pages of current aircraft
var pages

/**
 * Initialization functions for button views.
 */
var initializeViewFn = {
}

/**
 * Initialization functions for button actions.
 */
var initializeActionFn = {
}

initializeViewFn['image'] = function(view, key) {
  // Draw a static image
  view.currentImage = path.resolve(IMAGE_FOLDER + view.image);
  draw(view);
}

initializeViewFn['state_image'] = function(view, key) {
  // Draw a different image for each control value
  // view: { type: 'state_image', input: 'ANTI_SKID_SWITCH', states: { '0': 'AP_B_off.png', '1': 'AP_B_on.png' }},
  api.on(view.input, (currentValue) => {
    view.currentImage = path.resolve(IMAGE_FOLDER + view.states[currentValue]);
    draw(view);
  });
}

initializeViewFn['state_label'] = function (view, key) {
  // Draw a different text label for each control value
  // view: { type: 'state_label', text: 'LIGHTS', input: 'LANDING_LIGHTS', states: { '0': 'TAXI', '1': 'OFF', '2': 'LAND' }},
  api.on(view.input, (currentValue) => {
    renderText(view.text + "  " + view.states[currentValue], Object.assign({x: 3},view))
    .then((buffer) => {
      view.currentImageBuffer = buffer;
      draw(view)
    }).catch((buffer) => {
      console.log(error)
    })
  })
}

initializeViewFn['page_label'] = function (view, key) {
  // Draw the page  name on white background if the page is selected
  // view: { type: 'page_label', text: 'NMSP', page: 'NMSP'},

  renderText(view.text, 
    Object.assign(
      {
        x: 3
      },
      view,
      {
        fontColor: view._page == view.page ? 'black' : 'white',
        backgroundColor: view._page == view.page ? (view.onColor || 0xffffff00) : 0x00000000
      }
    )
  ).then((buffer) => {
    view.currentImageBuffer = buffer;
    draw(view)
  }).catch((buffer) => {
    console.log(error)
  })

}

initializeViewFn['led_label'] = function (view, key) {
  // Draw a label with different colors based on the control value. 0 => off (white text on black background), 1 => on (black text on color background)
  // view: { type: 'led_label', text: 'MASTER CAUTION', input: 'MASTER_CAUTION', onColor: 0xFFA50000 },
  api.on(view.input, (currentValue) => {
    renderText(view.text,
      Object.assign(
        { 
          fontName: 'open-sans', 
          fontSize: '14',
          x: 3
        },
        view, 
        { 
          fontColor: currentValue == '1' ? 'black' : 'white',
          backgroundColor: currentValue == '1' ? (view.onColor || 0xffffff00) : 0x00000000
        })
    ).then((buffer) => {
      view.currentImageBuffer = buffer;
      draw(view)
    }).catch((buffer) => {
      console.log(error)
    })
  })
}

initializeViewFn['label'] = function(view, key) {
  // Draw a static label, white on black background
  // view: { type: 'label', text: 'MAIN' },
  renderText(view.text,  Object.assign({x: 3},view)).then((buffer) => {
    view.currentImageBuffer = buffer
    draw(view)
  })
}

initializeActionFn['cycle_state'] = function (action, key) {
  // Cycle between a fixed set of possible values
  // action: { type: 'cycle_state', output: 'LANDING_LIGHTS', values: ['0', '1', '2'] }
  streamDeck.on(`up:${action.number}`, () => {
    let currentValue = api.getControlValue(action.output).toString()
    let currentValueIndex = action.values.indexOf(currentValue)
    let newValueIndex = (1 + currentValueIndex) % action.values.length
    let newValue = action.values[newValueIndex]
    api.sendMessage(`${action.output} ${newValue}\n`);
  });

}

initializeActionFn['push_button'] = function (action, key) {
  // Send 1 when button is pushed, 0 when button is released
  // action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
  streamDeck.on(`down:${action.number}`, () => {
    api.sendMessage(`${action.output} 1\n`);
  });
  streamDeck.on(`up:${action.number}`, () => {
    api.sendMessage(`${action.output} 0\n`);
  });

}

initializeActionFn['page'] = function (action, key) {
  // switch page on button release
  streamDeck.on(`up:${action.number}`, () => {
    displayPage(action.page);
  });
}

var currentAcft
api.on('_ACFT_NAME', function(acft){
  acft = acft.replace(/[^A-Za-z0-9\-]/g, '');
  if (acft != currentAcft) {
    currentAcft = acft
    console.log("Aircraft: '" + acft + "'")
    if (aircraftPages[acft]) {
      pages = aircraftPages[acft]
      initializePages(pages)
      displayPage('MAIN');
    }
  }
})



function initializePages(pages) {
  Object.keys(pages).forEach((pageName) => {
    var page = pages[pageName];

    for (let i = 1; i <= 15; i++) {
      page[i] = page[i] || {};

      var key = page[i];
      key._page = pageName;
      key.number = i;
      initializeView(key);
    }
  });
}

function initializeView(key) {
  if (key.view) {
    key.view.number = key.number
    key.view._page = key._page
    initializeViewFn[key.view.type](key.view, key)
  } else {
    key.view = {}
    key.view.number = key.number
    key.view._page = key._page
    draw(key.view)
  }
}

function initializeAction(key) {
  if (key.action) {
    key.action.number = key.number
    initializeActionFn[key.action.type](key.action, key)
  }
}





function displayPage(pageName) {
  console.log("DisplayPage(" + pageName + ")")
  streamDeck.removeButtonListeners();
  currentPage = pageName;
  var page = pages[pageName];

  Object.keys(page).forEach((keyNumber) => {
    var key = page[keyNumber];
    initializeAction(key);
    draw(key.view);
  });
}

function draw(view) {

  if (currentPage != view._page) { return; }

  if (view.currentImageBuffer) {
    streamDeck.drawImageBuffer(view.currentImageBuffer, view.number);
  }
  else if (view.currentImage) {
    streamDeck.drawImageFile(view.currentImage, view.number);
  }
  else {
    streamDeck.drawColor(0x000000, view.number);
  }
}


function pressKeyboard(keyboardKeys) {
  keyboardKeys = Array.isArray(keyboardKeys) ? keyboardKeys : [keyboardKeys];

  keyboardKeys.forEach((key) => {
    if (key.includes('+')) {
      var split = key.split('+');
      var modifier = split[0];
      var character = split[1];

      console.log('pressing combo key', modifier, character);
      robot.keyToggle(modifier, 'down');
      robot.keyToggle(character, 'down');
      robot.keyToggle(character, 'up');
      robot.keyToggle(modifier, 'up');
    }
    else {
      console.log('pressing single key', key);
      robot.keyTap(key);
    }
  });
}

/**
 * Return a font file with the specified type, size and color
 * @param {String} name - only open-sans is supported
 * @param {Integer} size - font size, 8 16 32 for color BLACK, 8 10 12 14 16 32 64 for color WHITE
 * @param {String} color - BLACK or WHITE
 */
function getFontFile(name, size, color) {
  return path.resolve(__dirname, "./fonts", name, name + "-" + size + "-" + color,  name + "-" + size + "-" + color + ".fnt" )
}


/**
 * render a text string.
 * @param {String} text - the string to draw
 * @param {Object} options alignmentX, alignmentY, x, y, fontName, fontSize, fontColor, margin, backgroundColor
 * @returns {Promise} promise with the image buffer or an error
 */
function renderText(text, options) {
  // sensible defaults for options
  options = Object.assign({}, {
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    fontName: 'open-sans',
    fontSize: 14,
    fontColor: 'white',
    margin: 0,
    backgroundColor: 0x00000000,
    bufferOnly: false
  }, options || {})

  // cache key
  let cacheKey = {
    alignmentX: options.alignmentX,
    alignmentY: options.alignmentY,
    fontFile: getFontFile(options.fontName, options.fontSize, options.fontColor),
    x: options.x || options.margin,
    y: options.y || options.margin,
    text: text,
    backgroundColor: options.backgroundColor
  }

  let hash = JSON.stringify(cacheKey)
  let cachedImageBuffer = _textCache[hash]

  return new Promise((resolve, reject) => {
    if (cachedImageBuffer) {
      resolve(cachedImageBuffer)
    }
    else {
      Jimp.loadFont(cacheKey.fontFile).then(font => {
        new Jimp(ICON_SIZE, ICON_SIZE, cacheKey.backgroundColor, (error, image) => {
          if (error) {
            console.log("Err: ", err, "Cache key: ", cacheKey)
            reject(error)
          } else {
            image.print(
              font,
              cacheKey.x,
              cacheKey.y,
              cacheKey,
              ICON_SIZE - cacheKey.x * 2,
              ICON_SIZE - cacheKey.y * 2,
              (err, image, { x, y }) => {
                if (err) {
                  console.log("Err: ", err, "Cache key: ", cacheKey)
                  reject(err)
                } else {
                  _textCache[hash] = image.bitmap.data
                  resolve(image.bitmap.data)
                }
              })
          }
        })
      }).catch(error => {
        console.log("Err: ", error, "Cache key: ", cacheKey)
        reject(error)
      })
    }
  })
}
  