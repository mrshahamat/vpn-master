/* globals vpn */
'use strict';

window.log = (e, c = '') => {
  const message = (new Date()).toTimeString().split(' ')[0] + ': ' + (e.message || e.error || e || 'unknown');

  window.log.cache.push([message, c]);
  window.log.cache = window.log.cache.slice(-10);
  // console.log(message);
  chrome.runtime.sendMessage({
    method: 'log',
    message,
    c
  });
};
window.log.cache = [];

const icon = {};
icon.set = (id = '/') => {
  const path = {
    '16': 'data/icons' + id + '16.png',
    '18': 'data/icons' + id + '18.png',
    '19': 'data/icons' + id + '19.png',
    '32': 'data/icons' + id + '32.png',
    '36': 'data/icons' + id + '36.png',
    '38': 'data/icons' + id + '38.png',
    '48': 'data/icons' + id + '48.png'
  };
  chrome.browserAction.setIcon({path});
};

icon.search = (reset = true) => {
  if (reset) {
    icon.search.index = 1;
  }
  icon.set('/validate/' + icon.search.index + '/');
  icon.search.id = window.setTimeout(icon.search, 300, false);
  icon.search.index = (icon.search.index + 1) % 5 || 1;
};
icon.search.index = 1;
icon.search.id = null;

icon.active = () => {
  icon.search.id = window.clearTimeout(icon.search.id);
  icon.set();
};

icon.disabled = () => {
  icon.search.id = window.clearTimeout(icon.search.id);
  icon.set('/disabled/');
};

chrome.runtime.onMessage.addListener(({method}) => {
  if (method === 'search') {
    vpn.search().catch(e => window.log(e, 'important'));
  }
  else if (method === 'stop') {
    vpn.stop();
  }
});

// FAQs & Feedback
{
  const {onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': true,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '?version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
}
