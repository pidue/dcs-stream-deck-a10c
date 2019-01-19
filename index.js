const streamDeckApi = require('stream-deck-api');
const DcsBiosApi = require('dcs-bios-api');
const path = require('path');
const robot = require('robotjs');
const Jimp = require('jimp')
const meow = require('meow');

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




String.prototype.centerJustify = function (length, char) {
  var i = 0;
  var str = this;
  var toggle = true;
  while (i + this.length < length) {
    i++;
    if (toggle)
      str = str + char;
    else
      str = char + str;
    toggle = !toggle;
  }
  return str;
}


// map aircraft name => pages
var aircraftPages = {
  'NONE': {
    MAIN: {
      // empty
    }
  }
} 

/*


pagina MISC (per startup)
ejection seat *
due MFCD * 
quattro SAS + takeoff trim *
canopy open close * 
landing gear * 
landing lights *
anti skid *

pagina VIEW
le varie viste... (come si fanno? combinazioni di tasti?)

pagina MAIN
CMSP Mode **
GUN/PAC **
landing gear **
rwr display CMSC_PRI *
jammer program **

*/


aircraftPages['A-10C'] = {
  MAIN: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'page_image', page: 'NMSP', image: 'page-nmsp-01.png', selImage: 'page-nmsp-sel-01.png' },
      action: { type: 'page', page: 'NMSP' }
    },
    3: {
      view: { type: 'page_image', page: 'AHCP', image: 'page-ahcp-01.png', selImage: 'page-ahcp-sel-01.png' },
      action: { type: 'page', page: 'AHCP' }
    },
    4: {
      view: { type: 'page_image', page: 'VIEW', image: 'page-view-01.png', selImage: 'page-view-sel-01.png' },
      action: { type: 'page', page: 'VIEW' }
    },
    5: {
      view: { type: 'state_image', input: 'MASTER_CAUTION',  states: { '0': 'master-caution-off-01.png', '1': 'master-caution-on-01.png' } },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
    6: {
      view: { type: 'image', image: 'page-fscp-01.png' },
      action: { type: 'page', page: 'FSCP' }
    },
    7: {
      view: { type: 'image', image: 'page-cmsp-01.png' },
      action: { type: 'page', page: 'CMSP' }
    },
    8: {
      view: { type: 'image', image: 'page-pwr-01.png' },
      action: { type: 'page', page: 'PWR' }
    },
    9: {
      view: { type: 'image', image: 'page-misc-01.png' },
      action: { type: 'page', page: 'MISC' }
    },
    10: {
      view: { type: 'state_image', input: 'GEAR_LEVER', states: { '0': 'landing-gear-up-01.png', '1': 'landing-gear-down-01.png' }},
      action: { type: 'toggle', output: 'GEAR_LEVER' }
    },
    11: {
      view: { type: 'state_image', input: 'CMSP_MODE', states: { '0': 'cmsp-mode-off-01.png', '1': 'cmsp-mode-stby-01.png', '2': 'cmsp-mode-man-01.png', '3': 'cmsp-mode-semi-01.png', '4': 'cmsp-mode-auto-01.png' } },
      action: { type: 'cycle_state', output: 'CMSP_MODE', values: ['2', '3', '4'] }
    },
    12: {
      view: { type: 'state_image',  input: 'AHCP_GUNPAC', states: { '0': 'gunpac-gun-01.png', '1': 'gunpac-safe-01.png', '2': 'gunpac-arm-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_GUNPAC', values: ['0', '1', '2'] }
    },
    13: {
      view: { type: 'image', image: 'rwr-sep-01.png' },
      action: { type: 'push_button', output: 'CMSC_SEP' }
    },
    14: {
      view: { type: 'state_image', input: 'CMSC_PRIO', states: { '0': 'rwr-pri-norm-01.png', '1': 'rwr-pri-pri-01.png' }},
      action: { type: 'push_button', output: 'CMSC_PRI' }
    },
    15: {
      view: { type: 'image', image: 'jmr-prog-01.png' },
      action: { type: 'push_button', output: 'CMSC_JMR' }
    },
        
    
  },
  NMSP: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'page_image', page: 'NMSP', image: 'page-nmsp-01.png', selImage: 'page-nmsp-sel-01.png' },
      action: { type: 'page', page: 'NMSP' }
    },
    3: {
      view: { type: 'page_image', page: 'AHCP', image: 'page-ahcp-01.png', selImage: 'page-ahcp-sel-01.png' },
      action: { type: 'page', page: 'AHCP' }
    },
    4: {
      view: { type: 'page_image', page: 'VIEW', image: 'page-view-01.png', selImage: 'page-view-sel-01.png' },
      action: { type: 'page', page: 'VIEW' }
    },
    5: {
      view: { type: 'state_image', input: 'MASTER_CAUTION',  states: { '0': 'master-caution-off-01.png', '1': 'master-caution-on-01.png' } },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
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
  },
  AHCP: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'page_image', page: 'NMSP', image: 'page-nmsp-01.png', selImage: 'page-nmsp-sel-01.png' },
      action: { type: 'page', page: 'NMSP' }
    },
    3: {
      view: { type: 'page_image', page: 'AHCP', image: 'page-ahcp-01.png', selImage: 'page-ahcp-sel-01.png' },
      action: { type: 'page', page: 'AHCP' }
    },
    4: {
      view: { type: 'page_image', page: 'VIEW', image: 'page-view-01.png', selImage: 'page-view-sel-01.png' },
      action: { type: 'page', page: 'VIEW' }
    },
    5: {
      view: { type: 'state_image', input: 'MASTER_CAUTION',  states: { '0': 'master-caution-off-01.png', '1': 'master-caution-on-01.png' } },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
    6: {
      view: { type: 'state_image', text: 'MASTER', input: 'AHCP_MASTER_ARM', states: { '0': 'master-train-01.png', '1': 'master-safe-01.png', '2': 'master-arm-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_MASTER_ARM', values: ['0', '1', '2'] }
    },
    7: {
      view: { type: 'state_image', text: ' GUN ', input: 'AHCP_GUNPAC', states: { '0': 'gunpac-gun-01.png', '1': 'gunpac-safe-01.png', '2': 'gunpac-arm-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_GUNPAC', values: ['0', '1', '2'] }
    },
    8: {
      view: { type: 'state_image', text: 'ALT SCE', input: 'AHCP_ALT_SCE', states: { '0': 'alt-sce-radar-01.png', '1': 'alt-sce-delta-01.png', '2': 'alt-sce-baro-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_ALT_SCE', values: ['0', '1', '2'] }
    },
    9: {
      view: { type: 'state_image', text: 'HUD CL', input: 'AHCP_HUD_DAYNIGHT', states: { '0': 'hud-night-01.png', '1': 'hud-day-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_HUD_DAYNIGHT', values: ['0', '1'] }
    },
    10: {
      view: { type: 'state_image', text: 'HUD MD', input: 'AHCP_HUD_MODE', states: { '0': 'hud-stby-01.png', '1': 'hud-norm-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_HUD_MODE', values: ['0', '1'] }
    },
    11: {
      view: { type: 'state_image', text: 'LASER', input: 'AHCP_LASER_ARM', states: { '0': 'laser-train-01.png', '1': 'laser-safe-01.png', '2': 'laser-arm-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_LASER_ARM', values: ['0', '1', '2'] }
    },
    12: {
      view: { type: 'state_image', text: ' TGP ', input: 'AHCP_TGP', states: { '0': 'tgp-off-01.png', '1': 'tgp-on-01.png'} },
      action: { type: 'cycle_state', output: 'AHCP_TGP', values: ['0', '1'] }
    },
    13: {
      view: { type: 'state_image', text: ' CICU ', input: 'AHCP_CICU', states: { '0': 'cicu-off-01.png', '1': 'cicu-on-01.png'} },
      action: { type: 'cycle_state', output: 'AHCP_CICU', values: ['0', '1'] }
    },
    14: {
      view: { type: 'state_image', text: ' JTRS ', input: 'AHCP_JTRS', states: { '0': 'jtrs-off-01.png', '1': 'jtrs-on-01.png'} },
      action: { type: 'cycle_state', output: 'AHCP_JTRS', values: ['0', '1'] }
    },
    15: {
      view: { type: 'state_image', text: 'IFFCC', input: 'AHCP_IFFCC', states: { '0': 'iffcc-off-01.png', '1': 'iffcc-test-01.png', '2': 'iffcc-on-01.png' } },
      action: { type: 'cycle_state', output: 'AHCP_IFFCC', values: ['0', '1', '2'] }
    },
  },
  VIEW: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'page_image', page: 'NMSP', image: 'page-nmsp-01.png', selImage: 'page-nmsp-sel-01.png' },
      action: { type: 'page', page: 'NMSP' }
    },
    3: {
      view: { type: 'page_image', page: 'AHCP', image: 'page-ahcp-01.png', selImage: 'page-ahcp-sel-01.png' },
      action: { type: 'page', page: 'AHCP' }
    },
    4: {
      view: { type: 'page_image', page: 'VIEW', image: 'page-view-01.png', selImage: 'page-view-sel-01.png' },
      action: { type: 'page', page: 'VIEW' }
    },
    5: {
      view: { type: 'state_image', input: 'MASTER_CAUTION',  states: { '0': 'master-caution-off-01.png', '1': 'master-caution-on-01.png' } },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
  },
  MISC: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },
    5: {
      view: { type: 'state_image', input: 'MASTER_CAUTION',  states: { '0': 'master-caution-off-01.png', '1': 'master-caution-on-01.png' } },
      action: { type: 'push_button', output: 'UFC_MASTER_CAUTION' }
    },
  },
  CMSP: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'state_label', text: ' JTSN ', input: 'CMSP_JTSN', states:  { '0': 'OFF', '1': 'ON'} },
      action: { type: 'push_button', output: 'CMSP_JTSN' }
    },
    3: {
      view: { type: 'led_label', input: 'CMSP_RTN', text: 'RTN' },
      action: { type: 'push_button', output: 'CMSP_RTN' }
    },
    4: {
      view: { type: 'label', text: 'DISP MENU' },
      action: { type: 'spring_loaded', output: 'CMSP_DISP', value: '2' }
    },
    5: {
      view: { type: 'led_label', input: 'CMSP_UPDN', text: 'UP', onValue: '2' },
      action: { type: 'spring_loaded', output: 'CMSP_UPDN', value: '2' }
    },
    6: {
      view: { type: 'led_label', input: 'CMSP_ARW1', text: ' SET  CHAF' },
      action: { type: 'push_button', output: 'CMSP_ARW1' }
    },
    7: {
      view: { type: 'led_label', input: 'CMSP_ARW2', text: ' SET  FLAR' },
      action: { type: 'push_button', output: 'CMSP_ARW2' }
    },
    8: {
      view: { type: 'led_label', input: 'CMSP_ARW3', text: ' SET  INTV' },
      action: { type: 'push_button', output: 'CMSP_ARW3' }
    },
    9: {
      view: { type: 'led_label', input: 'CMSP_ARW4', text: ' SET  CYCL' },
      action: { type: 'push_button', output: 'CMSP_ARW4' }
    },
    10: {
      view: { type: 'led_label', input: 'CMSP_UPDN', text: 'DN', onValue: '0' },
      action: { type: 'spring_loaded', output: 'CMSP_UPDN', value: '0' }
    },
    11: {
      view: { type: 'state_label', text: ' MWS ', input: 'CMSP_MWS', states:  { '0': 'OFF', '1': 'ON', '2': 'MENU'} },
      action: { type: 'cycle_state', output: 'CMSP_MWS', values: ['0', '1'] }
    },
    12: {
      view: { type: 'state_label', text: '  JMR  ', input: 'CMSP_JMR', states: { '0': 'OFF', '1': 'ON', '2': 'MENU'} },
      action: { type: 'cycle_state', output: 'CMSP_JMR', values: ['0', '1'] }
    },
    13: {
      view: { type: 'state_label', text: ' RWR ', input: 'CMSP_RWR', states: { '0': 'OFF', '1': 'ON', '2': 'MENU'} },
      action: { type: 'cycle_state', output: 'CMSP_RWR', values: ['0', '1'] }
    },
    14: {
      view: { type: 'state_label', text: ' DISP ', input: 'CMSP_DISP', states: { '0': 'OFF', '1': 'ON', '2': 'MENU'} },
      action: { type: 'cycle_state', output: 'CMSP_DISP', values: ['0', '1'] }
    },
    15: {
      view: { type: 'state_label', text: ' MODE ', input: 'CMSP_MODE', states: { '0': 'OFF', '1': 'STBY', '2': 'MAN', '3': 'SEMI', '4': 'AUTO' } },
      action: { type: 'cycle_state', output: 'CMSP_MODE', values: ['0', '1', '2', '3', '4'] }
    },
  },
  PWR: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },

    3: {
      view: { type: 'state_image', text: 'APU GEN', input: 'EPP_APU_GEN_PWR', states: { '0': 'apu-gen-off-01.png', '1': 'apu-gen-pwr-01.png' } },
      action: { type: 'cycle_state', output: 'EPP_APU_GEN_PWR', values: ['0', '1'] }
    },
    4: {
      view: { type: 'state_image', text: 'INVRTR', input: 'EPP_INVERTER', states: { '0': 'inverter-test-01.png', '1': 'inverter-off-01.png', '2': 'inverter-stby-01.png' } },
      action: { type: 'cycle_state', output: 'EPP_INVERTER', values: ['0', '1', '2'] }
    },
    5: {
      view: { type: 'state_image', text: 'EMER', input: 'EPP_EMER_FLOOD', states: { '0': 'emer-flood-off-01.png', '1': 'emer-flood-on-01.png'  } },
      action: { type: 'cycle_state', output: 'EPP_EMER_FLOOD', values: ['0', '1'] }
    },
    6: {
      view: { type: 'state_image', text: 'PITOT', input: 'ENVCP_PITOT_HEAT', states: { '0': 'pitot-off-01.png', '1': 'pitot-on-01.png'  } },
      action: { type: 'cycle_state', output: 'ENVCP_PITOT_HEAT', values: ['0', '1'] }
    },
    7: {
      view: { type: 'state_image', text: 'BLEED', input: 'ENVCP_BLEED_AIR', states: { '0': 'bleed-off-01.png', '1': 'bleed-on-01.png'  } },
      action: { type: 'cycle_state', output: 'ENVCP_BLEED_AIR', values: ['0', '1'] }
    },
    8: {
      view: { type: 'state_image', text: 'AC GEN L', input: 'EPP_AC_GEN_PWR_L', states: { '0': 'ac-gen-l-off-01.png', '1': 'ac-gen-l-pwr-01.png' } },
      action: { type: 'cycle_state', output: 'EPP_AC_GEN_PWR_L', values: ['0', '1'] }
    },
    9: {
      view: { type: 'state_image', text: 'AC GEN R', input: 'EPP_AC_GEN_PWR_R', states: { '0': 'ac-gen-r-off-01.png', '1': 'ac-gen-r-pwr-01.png' } },
      action: { type: 'cycle_state', output: 'EPP_AC_GEN_PWR_R', values: ['0', '1'] }
    },
    10: {
      view: { type: 'state_image', text: 'BATTERY', input: 'EPP_BATTERY_PWR', states: { '0': 'battery-off-01.png', '1': 'battery-pwr-01.png' } },
      action: { type: 'cycle_state', output: 'EPP_BATTERY_PWR', values: ['0', '1'] }
    },
    11: {
      view: { type: 'state_image', text: 'POSITION', input: 'LCP_POSITION', states: { '0': 'position-steady-01.png', '1': 'position-off-01.png', '2': 'position-flash-01.png' } },
      action: { type: 'cycle_state', output: 'LCP_POSITION', values: ['0', '1', '2'] }
    },
    12: {
      view: { type: 'state_image', text: 'ANTICOLL', input: 'LCP_ANTICOLLISION',  states: { '0': 'anticollision-off-01.png', '1': 'anticollision-on-01.png' } },
      action: { type: 'cycle_state', output: 'LCP_ANTICOLLISION', values: ['0', '1'] }
    },
    13: {
      view: { type: 'state_image', text: 'CDU', input: 'AAP_CDUPWR', states: { '0': 'cdu-off-01.png', '1': 'cdu-on-01.png' } },
      action: { type: 'cycle_state', output: 'AAP_CDUPWR', values: ['0', '1'] }
    },
    14: {
      view: { type: 'state_image', text: 'EGI', input: 'AAP_EGIPWR', states: { '0': 'egi-off-01.png', '1': 'egi-on-01.png' } },
      action: { type: 'cycle_state', output: 'AAP_EGIPWR', values: ['0', '1'] }
    },
    15: {
      view: { type: 'state_image', text: 'OXYGEN', input: 'OXY_SUPPLY', states: { '0': 'oxygen-off-01.png', '1': 'oxygen-on-01.png' } },
      action: { type: 'cycle_state', output: 'OXY_SUPPLY', values: ['0', '1'] }
    },
  },
  FSCP: {
    1: {
      view: { type: 'page_image', page: 'MAIN', image: 'page-main-01.png', selImage: 'page-main-sel-01.png' },
      action: { type: 'page', page: 'MAIN' }
    },
    2: {
      view: { type: 'state_image', input: 'FSCP_EXT_TANKS_WING', states: { '0': 'ext-tks-wing-off-01.png', '1': 'ext-tks-wing-on-01.png' } },
      action: { type: 'cycle_state', output: 'FSCP_EXT_TANKS_WING', values: ['0', '1'] }
    },
    3: {
      view: { type: 'state_image', input: 'FSCP_EXT_TANKS_FUS', states: { '0': 'ext-tks-fus-off-01.png', '1': 'ext-tks-fus-on-01.png' } },
      action: { type: 'cycle_state', output: 'FSCP_EXT_TANKS_FUS', values: ['0', '1'] }
    },
    4: {
      view: { type: 'state_image',  input: 'FSCP_LINE_CHECK', states: { '0': 'line-check-off-01.png', '1': 'line-check-test-01.png' } },
      action: { type: 'push_button', output: 'FSCP_LINE_CHECK' }
    },
    5: {
      view: { type: 'state_image',  input: 'FSCP_RCVR_LEVER', states: { '1': 'rcvr-close-01.png', '0': 'rcvr-open-01.png'  } },
      action: { type: 'cycle_state', output: 'FSCP_RCVR_LEVER', values: ['0', '1'] }
    },
    6: {
      view: { type: 'state_image',  input: 'FSCP_TK_GATE', states: { '1': 'tk-gate-open-01.png', '0': 'tk-gate-close-01.png'  } },
      action: { type: 'cycle_state', output: 'FSCP_TK_GATE', values: ['0', '1'] }
    },
    7: {
      view: { type: 'state_image',  input: 'FSCP_BOOST_WING_L', states: { '0': 'boost-pump-wing-l-off-01.png', '1': 'boost-pump-wing-l-on-01.png'  } },
      action: { type: 'cycle_state', output: 'FSCP_BOOST_WING_L', values: ['0', '1'] }
    },
    8: {
      view: { type: 'state_image',  input: 'FSCP_BOOST_WING_R', states: { '0': 'boost-pump-wing-r-off-01.png', '1': 'boost-pump-wing-r-on-01.png'  } },
      action: { type: 'cycle_state', output: 'FSCP_BOOST_WING_R', values: ['0', '1'] }
    },
    9: {
      view: { type: 'state_image',  input: 'FSCP_FD_WING_L', states: { '0': 'fill-disable-wing-l-off-01.png', '1': 'fill-disable-wing-l-dis-01.png' } },
      action: { type: 'cycle_state', output: 'FSCP_FD_WING_L', values: ['0', '1'] }
    },
    10: {
      view: { type: 'state_image',   input: 'FSCP_FD_WING_R', states: { '0': 'fill-disable-wing-r-off-01.png', '1': 'fill-disable-wing-r-dis-01.png' } },
      action: { type: 'cycle_state', output: 'FSCP_FD_WING_R', values: ['0', '1'] }
    },
    11: {
      view: { type: 'state_image',   input: 'FSCP_CROSSFEED', states: { '0': 'cross-feed-off-01.png', '1': 'cross-feed-on-01.png' } },
      action: { type: 'cycle_state', output: 'FSCP_CROSSFEED', values: ['0', '1'] }
    },
    12: {
      view: { type: 'state_image',  input: 'FSCP_BOOST_MAIN_L', states: { '0': 'boost-pump-main-l-off-01.png', '1': 'boost-pump-main-l-on-01.png'  } },
      action: { type: 'cycle_state', output: 'FSCP_BOOST_MAIN_L', values: ['0', '1'] }
    },
    13: {
      view: { type: 'state_image',  input: 'FSCP_BOOST_MAIN_R', states: { '0': 'boost-pump-main-r-off-01.png', '1': 'boost-pump-main-r-on-01.png'  } },
      action: { type: 'cycle_state', output: 'FSCP_BOOST_MAIN_R', values: ['0', '1'] }
    },
    14: {
      view: { type: 'state_image',  input: 'FSCP_FD_MAIN_L', states: { '0': 'fill-disable-main-l-off-01.png', '1': 'fill-disable-main-l-dis-01.png' } },
      action: { type: 'cycle_state', output: 'FSCP_FD_MAIN_L', values: ['0', '1'] }
    },
    15: {
      view: { type: 'state_image',   input: 'FSCP_FD_MAIN_R', states: { '0': 'fill-disable-main-r-off-01.png', '1': 'fill-disable-main-r-dis-01.png' } },
      action: { type: 'cycle_state', output: 'FSCP_FD_MAIN_R', values: ['0', '1'] }
    },
  }
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
  var fn = function(currentValue) {
    view.currentImage = path.resolve(IMAGE_FOLDER + view.states[currentValue]);
    draw(view);
  }
  api.on(view.input, fn);
  // initial state: the first one
  fn(api.getControlValue(view.input) || Object.keys(view.states)[0]);
}

initializeViewFn['state_label'] = function (view, key) {
  // Draw a different text label for each control value
  // view: { type: 'state_label', text: 'LIGHTS', input: 'LANDING_LIGHTS', states: { '0': 'TAXI', '1': 'OFF', '2': 'LAND' }},
  view.text = view.text.centerJustify(7, ' ')
  var fn = function(currentValue) {  
    renderText(view.text + "  " + view.states[currentValue].centerJustify(5, ' '), Object.assign({x: 3},view))
    .then((buffer) => {
      view.currentImageBuffer = buffer;
      draw(view)
    }).catch((buffer) => {
      console.log(error)
    })
  }
  api.on(view.input, fn)
  // initial state: the first one
  fn(api.getControlValue(view.input) || Object.keys(view.states)[0]);
}

initializeViewFn['page_label'] = function (view, key) {
  // Draw the page  name on white background if the page is selected
  // view: { type: 'page_label', text: 'NMSP', page: 'NMSP'},

  renderText(view.text, 
    Object.assign(
      {
        x: 4
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

initializeViewFn['page_image'] = function(view, key) {

  // Draw the page  name on white background if the page is selected
  // view: { type: 'page_label', page: 'NMSP', image: 'xxx.png', selImage: 'xxx-sel.png'},
  view.currentImage = path.resolve(IMAGE_FOLDER + (view._page == view.page ? view.selImage : view.image));
  draw(view);
}

initializeViewFn['led_label'] = function (view, key) {
  // Draw a label with different colors based on the control value. 0 => off (white text on black background), 1 => on (black text on color background)
  // view: { type: 'led_label', text: 'MASTER CAUTION', input: 'MASTER_CAUTION', onColor: 0xFFA50000, onValue: '2' },
  var onValue = view.onValue || '1'
  var fn = function(currentValue) {  
    renderText(view.text,
      Object.assign(
        { 
          fontName: 'open-sans', 
          fontSize: '14',
          x: 3
        },
        view, 
        { 
          fontColor: currentValue == onValue ? 'black' : 'white',
          backgroundColor: currentValue == onValue ? (view.onColor || 0xffffff00) : 0x00000000
        })
    ).then((buffer) => {
      view.currentImageBuffer = buffer;
      draw(view)
    }).catch((buffer) => {
      console.log(error)
    })
  }
  api.on(view.input, fn)
  // initial state: off
  fn(api.getControlValue(view.input) || '0');
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
    let currentValue = (api.getControlValue(action.output) || '0').toString()
    let currentValueIndex = action.values.indexOf(currentValue)
    let newValueIndex = (1 + currentValueIndex) % action.values.length
    let newValue = action.values[newValueIndex]
    api.sendMessage(`${action.output} ${newValue}\n`);
    console.log(`${action.output} ${newValue}\n`)
  });

}

initializeActionFn['toggle'] = function (action, key) {
  // Toggle a control
  // action: { type: 'toggle', output: 'LANDING_LIGHTS' }
  streamDeck.on(`up:${action.number}`, () => {
    api.sendMessage(`${action.output} TOGGLE\n`);
    console.log(`${action.output} TOGGLE\n`)
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

initializeActionFn['spring_loaded'] = function (action, key) {
  // Send the configured value when button is pushed, send the previous value when released
  // action: { type: 'spring_loaded', output: 'UFC_MASTER_CAUTION', value: '2' }
  streamDeck.on(`down:${action.number}`, () => {
    action._pv = (api.getControlValue(action.output) || '0').toString()
    api.sendMessage(`${action.output} ${action.value}\n`);
  });
  streamDeck.on(`up:${action.number}`, () => {
    api.sendMessage(`${action.output} ${action._pv}\n`);
  });

}


initializeActionFn['page'] = function (action, key) {
  // switch page on button release
  streamDeck.on(`up:${action.number}`, () => {
    displayPage(action.page);
  });
}

const cli = meow(`
TODO
`, {
	flags: {
		aircraft: {
			type: 'string',
			alias: 'a'
		}
	}
});

var currentAcft
if (cli.flags.aircraft && aircraftPages[cli.flags.aircraft]) {
  currentAcft = cli.flags.aircraft
  console.log("Aircraft: '" + currentAcft + "'")
  pages = aircraftPages[currentAcft]
  initializePages(pages)
  displayPage('MAIN');
} else {
  api.on('_ACFT_NAME', function(acft){
    acft = acft.replace(/[^A-Za-z0-9\-]/g, '');
    if (acft != currentAcft) {
      currentAcft = acft
      if (aircraftPages[currentAcft]) {
        console.log("Aircraft: '" + currentAcft + "'")
        pages = aircraftPages[acft]
        initializePages(pages)
        displayPage('MAIN');
      }
    }
  })  
}


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
    var fn = initializeViewFn[key.view.type]
    if (fn) {
      fn(key.view, key)
    } else {
      console.log("Invalid view type: " + key.view.number, key.view.type)
    }
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
  