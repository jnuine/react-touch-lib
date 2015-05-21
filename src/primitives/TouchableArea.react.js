'use strict';

var React = require('react');

var utils = {
  preventDefaultException: function (el, exceptions) {
		for ( var i in exceptions ) {
			if ( exceptions[i].test(el[i]) ) {
				return true;
			}
		}

		return false;
	}
};

var PREVENT_DEFAULT_EXCEPTION = { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ };

function preventEvent (event) {
  if (
    !utils.preventDefaultException(event.target, PREVENT_DEFAULT_EXCEPTION)
  ) {
    event.preventDefault();
  }
}

var TouchableArea = React.createClass({
  getDefaultProps: function() {
    return {
      component: 'div',
      touchable: true
    };
  },

  handleTouchStart: function(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchStart(e.touches, e.timeStamp);
    preventEvent(e);
  },

  handleTouchMove: function(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
    e.preventDefault();
  },

  handleTouchEnd: function(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchEnd(e.timeStamp);
    preventEvent(e);
  },

  render: function() {
    return (
      <div
        {...this.props}
        onTouchStart={this.handleTouchStart}
        onResponderMove={this.handleTouchMove}
        onResponderRelease={this.handleTouchEnd}>
        {this.props.children}
      </div>
    );
  }
});

module.exports = TouchableArea;
