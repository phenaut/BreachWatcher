(function (global) {
  if (global.browser) {
    return;
  }

  const api = global.chrome;
  if (!api || !api.runtime) {
    global.browser = {};
    return;
  }

  function callbackResult(callback, result) {
    if (typeof callback === 'function') {
      callback(result);
    }
  }

  function withRuntimeError(callback) {
    return function (...args) {
      const result = args[args.length - 1];
      if (chrome && chrome.runtime && chrome.runtime.lastError) {
        const err = chrome.runtime.lastError;
        chrome.runtime.lastError = undefined;
        if (typeof callback === 'function') {
          callback(err, undefined);
        }
        return;
      }
      if (typeof callback === 'function') {
        callback(null, result);
      }
    };
  }

  function promisify(fn, context) {
    return function (...args) {
      return new Promise((resolve, reject) => {
        try {
          fn.call(context || api, ...args, function (...cbArgs) {
            const err = chrome && chrome.runtime ? chrome.runtime.lastError : undefined;
            if (err) {
              chrome.runtime.lastError = undefined;
              reject(new Error(err.message));
              return;
            }

            if (cbArgs.length <= 1) {
              resolve(cbArgs[0]);
              return;
            }

            const resolved = cbArgs.length > 1 ? cbArgs[0] : undefined;
            resolve(resolved);
          });
        } catch (error) {
          reject(error);
        }
      });
    };
  }

  function promisifyStorage(storageArea) {
    const area = api.storage[storageArea];
    return {
      get(defaults) {
        return new Promise((resolve, reject) => {
          try {
            area.get(defaults || {}, (items) => {
              const err = chrome && chrome.runtime ? chrome.runtime.lastError : undefined;
              if (err) {
                chrome.runtime.lastError = undefined;
                reject(new Error(err.message));
                return;
              }
              resolve(items || {});
            });
          } catch (error) {
            reject(error);
          }
        });
      },
      set(items) {
        return new Promise((resolve, reject) => {
          try {
            area.set(items || {}, () => {
              const err = chrome && chrome.runtime ? chrome.runtime.lastError : undefined;
              if (err) {
                chrome.runtime.lastError = undefined;
                reject(new Error(err.message));
                return;
              }
              resolve();
            });
          } catch (error) {
            reject(error);
          }
        });
      },
      remove(keys) {
        return new Promise((resolve, reject) => {
          try {
            area.remove(keys || [], () => {
              const err = chrome && chrome.runtime ? chrome.runtime.lastError : undefined;
              if (err) {
                chrome.runtime.lastError = undefined;
                reject(new Error(err.message));
                return;
              }
              resolve();
            });
          } catch (error) {
            reject(error);
          }
        });
      }
    };
  }

  const runtime = {
    getManifest: () => api.runtime.getManifest(),
    getURL: (path) => api.runtime.getURL(path),
    sendMessage(message, options) {
      return new Promise((resolve, reject) => {
        try {
          api.runtime.sendMessage(message, options || {}, (response) => {
            const err = chrome && chrome.runtime ? chrome.runtime.lastError : undefined;
            if (err) {
              chrome.runtime.lastError = undefined;
              reject(new Error(err.message));
              return;
            }
            resolve(response);
          });
        } catch (error) {
          reject(error);
        }
      });
    },
    onMessage: api.runtime.onMessage || { addListener: function () {} }
  };

  if (api.runtime && typeof api.runtime.openOptionsPage === 'function') {
    runtime.openOptionsPage = () => api.runtime.openOptionsPage();
  }

  const tabs = {
    query: promisify(api.tabs.query, api.tabs),
    get: promisify(api.tabs.get, api.tabs),
    onActivated: api.tabs.onActivated || { addListener: function () {} },
    onRemoved: api.tabs.onRemoved || { addListener: function () {} }
  };

  const action = api.action || {
    setBadgeText: promisify(() => {}, api),
    setBadgeBackgroundColor: promisify(() => {}, api),
    setTitle: promisify(() => {}, api)
  };

  const storage = {
    local: promisifyStorage('local'),
    sync: promisifyStorage('sync')
  };

  const webNavigation = api.webNavigation || {
    onCompleted: { addListener: function () {} }
  };

  const ret = {
    runtime,
    tabs,
    action,
    storage,
    webNavigation
  };

  if (api.tabs && api.tabs.onActivated) {
    ret.tabs.onActivated = api.tabs.onActivated;
  }
  if (api.tabs && api.tabs.onRemoved) {
    ret.tabs.onRemoved = api.tabs.onRemoved;
  }
  if (api.runtime && api.runtime.onMessage) {
    ret.runtime.onMessage = api.runtime.onMessage;
  }
  if (api.webNavigation && api.webNavigation.onCompleted) {
    ret.webNavigation.onCompleted = api.webNavigation.onCompleted;
  }

  global.browser = ret;
})(typeof globalThis !== 'undefined' ? globalThis : this);
