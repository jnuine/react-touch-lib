'use strict';

// inspired by http://stackoverflow.com/questions/20870448/reactjs-modeling-bi-directional-infinite-scrolling

var Immutable = require('immutable');

var SimpleScroller = require('../simplescroller/SimpleScroller');

var React = require('react');

var InfiniteList = React.createClass({

  itemsTop: 0,
  itemsHeight: 0,
  maxListHeight: Math.Infinity,
  lastRenderScrollTop: 0,
  scrollTop: 0,

  getDefaultProps: function () {
    return {
      safetyZoneSize: 200, // You should really change that
      renderThreshold: 100, // and that too
      viewportHeight: 0
    };
  },

  getInitialState: function () {
    return {
      items: Immutable.Vector(),
    };
  },

  addTopItems: function (items, targetTop) {
    var index = items.first() || 0;
    var top = this.itemsTop;
    var height = this.itemsHeight;
    var getItemInfo = this.props.getItemInfo;

    while (top > targetTop) {
      var item = getItemInfo(--index);
      // log('getItemInfo', index);
      if (!item) break;
      top -= item.height;
      height += item.height;
      // log('adding item', index);
      items = items.unshift(index);
    }

    this.itemsTop = top;
    this.itemsHeight = height;
    return items;
  },

  removeTopItems: function (items, targetTop) {
    var index = items.first() || 0;
    var top = this.itemsTop;
    var height = this.itemsHeight;
    var getItemInfo = this.props.getItemInfo;
    // var log = console.log.bind(console, 'removeTopItems');

    while (top < targetTop) {
      // log('getItemInfo', index);
      var item = getItemInfo(index);
      if (!item) break;
      if (top - item.height > targetTop) break;
      top += item.height;
      height -= item.height;
      // log('removing item', index);
      items = items.shift();
      index++;
    }

    this.itemsTop = top;
    this.itemsHeight = height;
    return items;
  },

  addBottomItems: function (items, targetBottom) {
    var index = items.last() || 0;
    var top = this.itemsTop + this.itemsHeight;
    var getItemInfo = this.props.getItemInfo;
    // var log = console.log.bind(console, 'addBottomItems');

    while (top < targetBottom) {
      var item = getItemInfo(++index);
      // log('getItemInfo', index);
      if (!item) {
        // we've reached end of list, let's set this.maxListHeight
        this.maxListHeight = top;
        break;
      }
      top += item.height;
      // log('adding item', index);
      items = items.push(index);
    }

    this.itemsHeight = top - this.itemsTop;
    return items;
  },

  removeBottomItems: function (items, targetBottom) {
    var index = items.last() || 0;
    var top = this.itemsTop + this.itemsHeight;
    var getItemInfo = this.props.getItemInfo;
    // var log = console.log.bind(console, 'removeBottomItems');

    while (top > targetBottom) {
      // log('getItemInfo', index);
      var item = getItemInfo(index);
      if (!item) break;
      if (top - item.height < targetBottom) break;
      top -= item.height;
      // log('removing item', index);
      items = items.pop();
      index--;
    }

    this.itemsHeight = top - this.itemsTop;
    return items;
  },

  handleScroll: function (left, top) {
    // console.log('HANDLE SCROLL', this.lastRenderScrollTop, top, this.lastRenderScrollTop - top);
    this.scrollTop = top;

    var shouldComponentUpdate = true;
    if (top < 0) {
      shouldComponentUpdate = false;
    }
    if (top + this.props.viewportHeight >= this.maxListHeight) {
      shouldComponentUpdate = false;
    }
    if (Math.abs(this.lastRenderScrollTop - top) < this.props.renderThreshold) {
      // console.log(Math.abs(this.lastRenderScrollTop - top), '<', this.props.renderThreshold);
      shouldComponentUpdate = false;
    }

    if (shouldComponentUpdate) {
      this.prerender();
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if (!this.props.viewportHeight && nextProps.viewportHeight) {
      this.prerender(nextProps.viewportHeight);
    }
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    // console.log('SHOULD COMPONENT UPDATE', nextProps);
    // Shout out to Immutable :)
    return (this.state.items !== nextState.items);
  },

  componentDidUpdate: function () {
    this.props.onListDidUpdate();
  },

  prerender: function (viewportHeight) {
    // console.log('PRE RENDER');
    viewportHeight = viewportHeight || this.props.viewportHeight;

    var scrollTop = this.scrollTop;
    var targetTop = Math.max(scrollTop - this.props.safetyZoneSize, 0);
    var targetBottom = scrollTop + viewportHeight + this.props.safetyZoneSize;

    var items = this.state.items;

    if (this.itemsTop > targetTop) {
      items = this.addTopItems(items, targetTop);
    }
    else {
      items = this.removeTopItems(items, targetTop);
    }

    if (this.itemsTop + this.itemsHeight > targetBottom) {
      items = this.removeBottomItems(items, targetBottom);
    }
    else {
      items = this.addBottomItems(items, targetBottom);
    }

    this.setState({
      items: items
    });
  },

  render: function () {
    // console.info('RENDER');
    var getItem = this.props.getItem;

    var topFillerHeight = Math.max(this.itemsTop, 0);
    var bottomFillerHeight = Math.max(this.maxListHeight - this.itemsTop - this.itemsHeight, 0);

    if (this.maxListHeight === Math.Infinity) bottomFillerHeight = 0;

    this.lastRenderScrollTop = this.scrollTop;

    return (
      <div key="inifinite-list" className="InfiniteList">
        <div key="top-filler" style={{height: topFillerHeight}} />
        <div key="content">
          {
            this.state.items
              .map(function (index) { return getItem(index); })
              .toArray()
          }
        </div>
        <div key="bottom-filler" style={{height: bottomFillerHeight}} />
      </div>
    );
  }
});

var InifiniteScroller = React.createClass({

  componentDidMount: function () {
    this.scrollerHeight = this.getDOMNode().clientHeight;
    this.forceUpdate();
  },

  handleScroll: function (left, top) {
    this.refs['inifinite-list'].handleScroll(left, top);
  },

  handleListDidUpdate: function () {
    this.refs.scroller.refreshScroller();
  },

  render: function () {
    console.info('InifiniteScroller', 'render');
    return (
      <SimpleScroller
        {...this.props}
        key="scroller"
        ref="scroller"
        setChildrenScrollProps={true}
        onScroll={this.handleScroll} >
        <InfiniteList
          ref="inifinite-list"
          viewportHeight={this.scrollerHeight}
          renderThreshold={this.props.renderThreshold}
          getItem={this.props.getItem}
          getItemInfo={this.props.getItemInfo}
          onListDidUpdate={this.handleListDidUpdate} />
      </SimpleScroller>
    );
  }

});

module.exports = InifiniteScroller;
