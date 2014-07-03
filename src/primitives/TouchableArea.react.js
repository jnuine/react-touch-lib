/** @jsx React.DOM */

var React = require('react');

var TouchableArea = React.createClass({
  getDefaultProps: function() {
    return {
      component: React.DOM.div,
      touchable: true
    };
  },

  handleTouchStart: function(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchStart(e.touches, e.timeStamp);
  },

  handleTouchMove: function(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
  },

  handleTouchEnd: function(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchEnd(e.timeStamp);
  },

  render: function() {
    var component = this.props.component;
    return this.transferPropsTo(
      <component
        onTouchStart={this.handleTouchStart}
        onResponderMove={this.handleTouchMove}
        onResponderRelease={this.handleTouchEnd}>
        {this.props.children}
      </component>
    );
  }
});

module.exports = TouchableArea;