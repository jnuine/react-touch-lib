/** @jsx React.DOM */

var React = require('react');

var AnimatableContainer = require('../../primitives/AnimatableContainer');
var TouchableArea = require('../../primitives/TouchableArea');

var SimpleSwipeBehaviors = require('./SimpleSwipeBehaviors');

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

var isSwipingStarting;

var SimpleSwipe = React.createClass({

  sideMeasured: false,

  getInitialState: function () {
    return {
      isSwiping: false,
      left: 0
    };
  },

  /**
   * Props:
   * behavior: transition, rotate, opacity given scroll,
   * side: side content to show when swiping
   * breakpoint: when to stop the swipe (function to which we pass client and side width)
   */
  getDefaultProps: function () {
    return {
      behavior: SimpleSwipeBehaviors.LINEAR_CONTENT_ONLY,
      threshold: 10,
      side: <div />
    };
  },

  componentWillMount: function () {
    this.scroller = new (this.props.Scroller)(this.handleScroll, {
      bouncing: false,
      scrollingX: true,
      scrollingY: false,
      snapping: true
    });
  },

  componentDidMount: function () {
    this._measure();
  },

  componentDidUpdate: function () {
    if (this.refs.side && !this.sideMeasured) {
      this._measure();
      this.sideMeasured = true;
    }
  },

  getContentWidth: function () {
    var node = this.refs.content.getDOMNode();
    var width = Math.max(node.clientWidth, node.scrollWidth, node.offsetWidth);
    return width;
  },

  getContentHeight: function () {
    var node = this.refs.content.getDOMNode();
    var height = Math.max(node.clientHeight, node.scrollHeight,
      node.offsetHeight);
    return height;
  },

  getSideWidth: function () {
    var side = this.refs.side;
    if (side) {
      var node = side.getDOMNode();
      var firstChild = node.firstChild;
      if (firstChild) {
        return Math.max(firstChild.clientWidth, firstChild.scrollWidth,
          firstChild.offsetWidth);
      }
    }
    // Arbitrary
    return 10;
  },

  _measure: function () {
    var nodeWidth = this.getContentWidth();
    var nodeHeight = this.getContentHeight();
    var sideWidth = this.getSideWidth();
    this.scroller.setDimensions(
      nodeWidth,
      nodeHeight,
      nodeWidth + sideWidth,
      nodeHeight
    );
    var breakpoint = this.props.breakpoint(nodeWidth, sideWidth);
    this.scroller.setSnapSize(-1 * breakpoint, nodeHeight);
  },

  handleScroll: function(left) {
    var side = this.refs.side;
    if (side) {
      var nodeWidth = this.getContentWidth();
      var sideWidth = this.getSideWidth();
      if (left > this.props.breakpoint(nodeWidth, sideWidth)) return;
    }
    this.setState({
      left: left
    });
  },

  handleStartShouldSetResponder: function (event, id) {
    console.log(id, 'handleStartShouldSetResponder');
    if (event.type === 'touchstart') {
      this.setState({isSwiping: false});
      isSwipingStarting = true;
      startCoords.x = getAxisCoordOfEvent(Axis.x, event.nativeEvent);
      startCoords.y = getAxisCoordOfEvent(Axis.y, event.nativeEvent);
      console.log(id, 'Setting responder for start');
      return true;
    }
    return false;
  },

  getMoveDelta: function (event) {
    var pageX = getAxisCoordOfEvent(Axis.x, event.nativeEvent);
    var pageY = getAxisCoordOfEvent(Axis.y, event.nativeEvent);
    var absDistanceX = Math.abs(pageX - startCoords.x);
    var absDistanceY = Math.abs(pageY - startCoords.y);
    return absDistanceX - absDistanceY;
  },

  handleMoveShouldSetResponder: function (event, id) {
    var isTouch = event.type === 'touchmove';
    console.log(id, 'handleMoveShouldSetResponder', isTouch);
    if (!isTouch) return false;
    if (this.state.isSwiping) return true;
    if (isSwipingStarting) {
      var delta = this.getMoveDelta(event);
      if (delta > this.props.threshold) {
        console.log(id, 'Setting responder to move');
        this.setState({isSwiping: true});
        return true;
      }
      else if (delta > -1 * this.props.threshold) {
        console.log(id, 'Not setting responder to move, need to see more');
      }
      else if (delta <= -1 * this.props.threshold){
        console.log(id, 'Not setting responder to move');
        isSwipingStarting = false;
      }
    }
    return false;
  },

  render: function () {
    var behavior = this.props.behavior;

    var side = null;
    var content = (
      <AnimatableContainer>
        <div ref="content">
          {this.props.children}
        </div>
      </AnimatableContainer>
    );

    if (this.state.left) {
      var nodeWidth = this.getContentWidth();
      var sideWidth = this.getSideWidth();
      var breakpoint = this.props.breakpoint(nodeWidth, sideWidth);
      side = (
        <AnimatableContainer
          translate={behavior.side.translate(nodeWidth, sideWidth, breakpoint, this.state.left)}
          rotate={behavior.side.rotate(nodeWidth, sideWidth, breakpoint, this.state.left)}
          opacity={behavior.side.opacity(nodeWidth, sideWidth, breakpoint, this.state.left)}>
          <div ref="side">
            {this.props.side}
          </div>
        </AnimatableContainer>
      );
      content = (
        <AnimatableContainer
          translate={behavior.content.translate(nodeWidth, sideWidth, breakpoint, this.state.left)}
          rotate={behavior.content.rotate(nodeWidth, sideWidth, breakpoint, this.state.left)}
          opacity={behavior.content.opacity(nodeWidth, sideWidth, breakpoint, this.state.left)}>
          <div ref="content">
            {this.props.children}
          </div>
        </AnimatableContainer>
      );
    }


    return this.transferPropsTo(
      <TouchableArea
        style={{position: 'relative'}}
        scroller={this.scroller}
        onStartShouldSetResponder={this.handleStartShouldSetResponder}
        onMoveShouldSetResponder={this.handleMoveShouldSetResponder}>
        {side}
        {content}
      </TouchableArea>
    );
  }
});

module.exports = SimpleSwipe;