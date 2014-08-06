/** @jsx React.DOM */

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
  getInitialState: function () {
    return { left: 0, top: 0 };
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
  },

  componentDidUpdate: function (prevProps) {
    this.configured = !(
      this.configured &&
      (!this.props.children && prevProps.children) ||
      (this.props.children && !prevProps.children) ||
      (this.props.children.length !== prevProps.children.length)
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

  refreshScroller: function () {
    var node = this.getDOMNode();
    var contentNode = this.refs.content.getDOMNode();
    this.scroller.setDimensions(
      node.clientWidth,
      node.clientHeight,
      contentNode.clientWidth,
      contentNode.clientHeight
    );
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
      else if (delta <= -1 * this.props.threshold){
        isScrollingStarting = false;
      }
    }
    return false;
  },

  handleScroll: function(left, top) {
    this.props.onScroll(left, top);
    // TODO: zoom
    this.setState({
      left: left,
      top: top
    });
  },

  render: function() {
    return this.transferPropsTo(
      <TouchableArea
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