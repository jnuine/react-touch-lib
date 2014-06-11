var React = require('react');

var ReactTouch = {
  setup: function () {
    React.initializeTouchEvents(true);

    var EventPluginHub = require('react/lib/EventPluginHub');
    var ResponderEventPlugin = require('./thirdparty/ResponderEventPlugin');
    var TapEventPlugin = require('./thirdparty/TapEventPlugin');

    EventPluginHub.injection.injectEventPluginsByName({
      ResponderEventPlugin: ResponderEventPlugin,
      TapEventPlugin: TapEventPlugin
    });

    return React;
  }
};

module.exports = ReactTouch;
