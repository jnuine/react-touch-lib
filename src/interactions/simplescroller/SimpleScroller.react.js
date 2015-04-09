'use strict';

var React = require('react');

var AnimatableContainer = require('../../primitives/AnimatableContainer');
var TouchableArea = require('../../primitives/TouchableArea');

var ANIMATABLE_CONTAINER_STYLE = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0
};

var ViewportMetrics = require('react/lib/ViewportMetrics');
var TouchEventUtils = require('../../eventplugins/thirdparty/TouchEventUtils');

var startCoords = { x: null, y: null };

var Axis = {
  x: {page: 'pageX', client: 'clientX', envScroll: 'currentPageScrollLeft'},
  y: {page: 'pageY', client: 'clientY', envScroll: 'currentPageScrollTop'}
};

function getAxisCoordOfEvent(axis, nativeEvent) {
  var singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch[axis.page];
  }
  return axis.page in nativeEvent ?
    nativeEvent[axis.page] :
    nativeEvent[axis.client] + ViewportMetrics[axis.envScroll];
}

var isScrolling;
var isScrollingStarting;

var SimpleScroller = React.createClass({
  dimensions: {},

  getInitialState: function () {
    return { left: 0, top: this.props.scrollTop || 0 };
  },

  getDefaultProps: function () {
    return {
      threshold: 10,
      options: {
        scrollingY: true,
        scrollingX: false
      },
      onScroll: function () {}
    };
  },

  componentWillMount: function () {
    this.configured = false;
    this.scroller = new (this.props.Scroller)(this.handleScroll, this.props.options);
  },

  componentDidMount: function () {
    this.configure();
    this.scroller.scrollTo(this.state.left, this.state.top);
    global.__scrollTop = this.state.top;
  },

  componentDidUpdate: function (prevProps) {
    this.configured = !(
      this.configured &&
      (this.props.children !== prevProps.children)
    );
    this.configure();
  },

  configure: function() {
    if (this.configured) {
      return;
    }
    this.configured = true;
    this.refreshScroller();
  },

  scrollToTop: function () {
    this.scroller.scrollTo(this.state.left, 0);
  },

  refreshScroller: function () {
    var node = this.getDOMNode();
    var contentNode = this.refs.content.getDOMNode();
    this.setDimensions(
      node.clientWidth,
      node.clientHeight,
      contentNode.clientWidth,
      contentNode.clientHeight
    );
  },

  setDimensions: function (clientWidth, clientHeight, contentWidth, contentHeight) {
    this.dimensions = {
      clientWidth: clientWidth || this.dimensions.clientWidth,
      clientHeight: clientHeight || this.dimensions.clientHeight,
      contentWidth: contentWidth || this.dimensions.contentWidth,
      contentHeight: (
        this.props.contentHeight || contentHeight ||
        this.dimensions.contentHeight
      )
    };

    this.scroller.setDimensions(
      clientWidth,
      clientHeight,
      contentWidth,
      this.props.contentHeight || contentHeight
    );

    contentHeight = this.props.contentHeight || contentHeight;

  },

  handleStartShouldSetResponder: function (event) {
    if (event.type === 'touchstart') {
      isScrolling = false;
      isScrollingStarting = true;
      startCoords.x = getAxisCoordOfEvent(Axis.x, event.nativeEvent);
      startCoords.y = getAxisCoordOfEvent(Axis.y, event.nativeEvent);
      return true;
    }
    return false;
  },

  getMoveDelta: function (event) {
    var pageX = getAxisCoordOfEvent(Axis.x, event.nativeEvent);
    var pageY = getAxisCoordOfEvent(Axis.y, event.nativeEvent);
    var absDistanceX = Math.abs(pageX - startCoords.x);
    var absDistanceY = Math.abs(pageY - startCoords.y);
    return this.props.options.scrollingX ?
      absDistanceX - absDistanceY :
      absDistanceY - absDistanceX;
  },

  handleMoveShouldSetResponder: function (event) {
    var isTouch = event.type === 'touchmove';
    if (!isTouch) return false;
    if (this.props.options.scrollingX && this.props.options.scrollingY) {
      return true;
    }
    if (isScrolling) return true;
    if (isScrollingStarting) {
      var delta = this.getMoveDelta(event);
      if (delta > this.props.threshold) {
        isScrolling = true;
        return true;
      }
      else if (delta > -1 * this.props.threshold) { }
      else if (delta <= -1 * this.props.threshold) {
        isScrollingStarting = false;
      }
    }
    return false;
  },

  handleScroll: function(left, top) {
    if (top >= 0 && top < (this.dimensions.contentHeight - this.dimensions.clientHeight)) {
      this.props.onScroll(left, top);
    }
    global.__scrollTop = top;
    this.setState({
      left: left,
      top: top
    });
  },

  render: function() {
    return (
      <TouchableArea
        {...this.props}
        scroller={this.scroller}
        style={{ overflow: 'hidden' }}
        onStartShouldSetResponder={this.handleStartShouldSetResponder}
        onMoveShouldSetResponder={this.handleMoveShouldSetResponder}>
        <AnimatableContainer
          translate={{x: -1 * this.state.left, y: -1 * this.state.top}}
          style={ANIMATABLE_CONTAINER_STYLE}>
          <div ref="content">{this.props.children}</div>
        </AnimatableContainer>
      </TouchableArea>
    );
  }
});

module.exports = SimpleScroller;