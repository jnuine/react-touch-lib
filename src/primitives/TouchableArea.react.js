'use strict';

var React = require('react');

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
    e.preventDefault();
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
    e.preventDefault();
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
