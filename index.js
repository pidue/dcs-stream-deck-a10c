const streamDeckApi = require('stream-deck-api');
const DcsBiosApi = require('dcs-bios-api');
const path = require('path');
const robot = require('robotjs');

const IMAGE_FOLDER = './images/';

var api = new DcsBiosApi({ logLevel: 'INFO' });
var streamDeck = streamDeckApi.getStreamDeck();
api.startListening();

process.on('SIGINT', () => {
  streamDeck.reset();
  streamDeck.close();
  api.stopListening();
  process.exit();
});

streamDeck.reset();

var pages = {
  MAIN: {
    1: {
      view: { type: 'state_image', input: 'ANTI_SKID_SWITCH', states: { '0': 'AP_B_off.png', '1': 'AP_B_on.png' } },
      action: { type: 'cycle_state', output: 'ANTI_SKID_SWITCH', values: ['0', '1'] }
      // view: { type: 'state_image', input: 'ANTI_SKID_SWITCH', states: { '0': 'AP_B_off.png', '1': 'AP_B_on.png' }},
      // action: { type: 'cycle_state', output: 'ANTI_SKID_SWITCH', values: ['0', '1'] }
    },
    2: {
      view: { type: 'state_label', text: 'LIGHTS', input: 'LANDING_LIGHTS', states: { '0': 'TAXI', '1': 'OFF', '2': 'LAND' } },
      action: { type: 'cycle_state', output: 'LANDING_LIGHTS', values: ['0', '1', '2'] }
    },
    3: {
      view: { type: 'led_label', text: 'ANTI SKID', input: 'ANTI_SKID_SWITCH' },
      action: { type: 'cycle_state', output: 'ANTI_SKID_SWITCH', values: ['0', '1'] }
    },
    5: {
      view: { type: 'state_image', input: 'MASTER_CAUTION', states: { '0': 'AP_B_off.png', '1': 'AP_B_on.png' } },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
    6: {
      view: { type: 'state_image', input: 'NMSP_HARS_LED', states: { '0': 'hars_off.png', '1': 'hars_on.png' }},
      action: { type: 'push_button', output: 'NMSP_HARS_BTN' }
    },
    15: {
      view: { type: 'led_label', text: 'MASTER CAUTION', input: 'MASTER_CAUTION', onColor: 0xFFA50000 },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
    14: {
      view: { type: 'image', image: 'hars_off.png' },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
    13: {
      view: { type: 'image', image: 'hars_on.png' },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
  },
  AAP: {
    1: {
      view: { type: 'label', text: '111' },
    },
    3: {
      view: { type: 'label', text: 'MAIN' },
      action: { type: 'page', page: 'MAIN' }
    },
  },
};

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
    streamDeck.drawText(view.text + "  " + view.states[currentValue], view.number, { x: 3, bufferOnly: true }).then((buffer) => {
      view.currentImageBuffer = buffer;
      draw(view)
    }).catch((buffer) => {
      console.log(error)
    })
  })
}

initializeViewFn['led_label'] = function (view, key) {
  // Draw a label with different colors based on the control value. 0 => off (white text on black background), 1 => on (black text on color background)
  // view: { type: 'led_label', text: 'MASTER CAUTION', input: 'MASTER_CAUTION', onColor: 0xFFA50000 },
  api.on(view.input, (currentValue) => {
    streamDeck.drawText(view.text, view.number, 
        { x: 3, 
          bufferOnly: true, 
          fontFile: streamDeck.getFontFile('open-sans', '14', currentValue  == '1' ? 'black' : 'white'),
          background: currentValue == '1' ? (view.onColor || 0xffffff00)   : 0x00000000
         }
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
  streamDeck.drawText(view.text, view.number, { x: 3,  bufferOnly: true }).then((buffer) => {
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

initializePages(pages);

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


var currentPage;
displayPage('MAIN');

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
