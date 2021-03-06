'use strict';

var React = require('react');

var AnimatableContainer = require('../../primitives/AnimatableContainer');
var LeftNavBehaviors = require('./LeftNavBehaviors');
var TouchableArea = require('../../primitives/TouchableArea');

var SimpleLeftNavContainer = React.createClass({
  componentWillMount: function () {
    this.scroller = new (this.props.Scroller)(this._handleScroll, {
      bouncing: false,
      scrollingX: true,
      scrollingY: false,
      snapping: true
    });
  },

  componentDidMount: function () {
    this._measure();
  },

  _measure: function () {
    var node = React.findDOMNode(this);
    this.scroller.setDimensions(
      node.clientWidth,
      node.clientHeight,
      node.clientWidth + this.props.sideWidth,
      node.clientHeight
    );
    this.scroller.setSnapSize(this.props.sideWidth, node.clientHeight);
    this.scroller.scrollTo(this.props.sideWidth, 0);
  },

  componentDidUpdate: function (prevProps) {
    if (this.props.sideWidth !== prevProps.sideWidth) {
      this._measure();
    }
  },

  closeNav: function () {
    if (this.isNavOpen()) {
      this.scroller.scrollTo(this.props.sideWidth, 0, true);
    }
  },

  _handleScroll: function (left) {
    this.setState({scrollLeft: left});
  },

  getInitialState: function () {
    return {scrollLeft: 0};
  },

  getDefaultProps: function () {
    return {
      behavior: LeftNavBehaviors.PARALLAX_FADE
    };
  },

  openNav: function () {
    if (this.isNavOpen()) {
      this.scroller.scrollTo(this.props.sideWidth, 0, true);
    } else {
      this.scroller.scrollTo(0, 0, true);
    }
  },

  _handleContentTouchTap: function (e) {
    if (!this.isNavOpen()) {
      return;
    }

    this.scroller.scrollTo(this.props.sideWidth, 0, true);
    e.preventDefault();
  },

  isNavOpen: function () {
    return this.state.scrollLeft !== this.props.sideWidth;
  },

  isNavAnimating: function () {
    return !(
      this.state.scrollLeft === this.props.sideWidth ||
      this.state.scrollLeft === 0
    );
  },

  render: function () {
    // props:
    // sideWidth
    // topContent
    // sideContent
    // children (big content area)

    var side = null;

    // TODO: we could do this with style calc
    var sideStyle = Object.assign(
      {},
      {
        bottom: 0,
        left: this.props.sideWidth * -1,
        position: 'absolute',
        top: 0,
        width: this.props.sideWidth
      },
      this.props.sideStyle,
      this.isNavAnimating() ? {} : this.props.sideOpenedStyle
    );

    var behavior = this.props.behavior;

    if (this.isNavOpen()) {
      side = (
        <AnimatableContainer
          style={sideStyle}
          translate={behavior.side.translate(this.props.sideWidth, this.state.scrollLeft)}
          rotate={behavior.side.rotate(this.props.sideWidth, this.state.scrollLeft)}
          opacity={behavior.side.opacity(this.props.sideWidth, this.state.scrollLeft)}>
          {this.props.sideContent}
        </AnimatableContainer>
      );
    }

    var contentTouchableAreaStyle = {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    };

    var topStyle = {
      height: this.props.topHeight,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    };

    var contentStyle = {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: this.props.topHeight
    };

    return (
      <div {...this.props}>
        {side}
        <AnimatableContainer
          style={contentStyle}
          translate={behavior.content.translate(this.props.sideWidth, this.state.scrollLeft)}
          rotate={behavior.content.rotate(this.props.sideWidth, this.state.scrollLeft)}
          opacity={behavior.content.opacity(this.props.sideWidth, this.state.scrollLeft)}>
          <TouchableArea
            style={contentTouchableAreaStyle}
            scroller={this.scroller}
            touchable={this.isNavOpen()}
            onTouchTap={this._handleContentTouchTap}>
            {this.props.children}
          </TouchableArea>
        </AnimatableContainer>
        <AnimatableContainer
          style={topStyle}
          translate={behavior.top.translate(this.props.sideWidth, this.state.scrollLeft)}
          rotate={behavior.top.rotate(this.props.sideWidth, this.state.scrollLeft)}
          opacity={behavior.top.opacity(this.props.sideWidth, this.state.scrollLeft)}>
          {this.props.topContent}
        </AnimatableContainer>
      </div>
    );
  }
});

module.exports = SimpleLeftNavContainer;
