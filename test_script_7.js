
    const _oldFetch = window.fetch;
    window.fetch = function() {
      if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].startsWith('config.json')) {
        arguments[0] = '../' + arguments[0];
      }
      return _oldFetch.apply(this, arguments);
    };
  
