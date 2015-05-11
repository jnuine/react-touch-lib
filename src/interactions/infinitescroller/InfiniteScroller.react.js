'use strict';

// inspired by http://stackoverflow.com/questions/20870448/reactjs-modeling-bi-directional-infinite-scrolling

// var Immutable = require('immutable');
var operative = require('operative');

var SimpleScroller = require('../simplescroller/SimpleScroller');

var React = require('react');

function KeyPool () {
  var length = 0;
  this._generate = function () {
    this._free.push(length++);
  };
  this._free = [];
}

KeyPool.prototype.get = function () {
  if (this._free.length === 0) {
    this._generate();
  }
  return this._free.pop();
};

KeyPool.prototype.release = function (key) {
  this._free.unshift(key);
};

var InfiniteList = React.createClass({

  keyPool: new KeyPool(),
  itemsTop: 0,
  itemsHeight: 0,
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
      items: [],
    };
  },

  addTopItems: function (items, targetTop) {
    var index = items.first() ? items.first().index : 0;
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
      items = items.unshift({
        index: index,
        key: this.keyPool.get()
      });
    }

    this.itemsTop = top;
    this.itemsHeight = height;
    return items;
  },

  removeTopItems: function (items, targetTop) {
    var index = items.first() ? items.first().index : 0;
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
      this.keyPool.release(items.first().key);
      items = items.shift();
      index++;
    }

    this.itemsTop = top;
    this.itemsHeight = height;
    return items;
  },

  addBottomItems: function (items, targetBottom) {
    var index = items.last() ? items.last().index : 0;
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
      items = items.push({
        index: index,
        key: this.keyPool.get()
      });
    }

    this.itemsHeight = top - this.itemsTop;
    return items;
  },

  removeBottomItems: function (items, targetBottom) {
    var index = items.last() ? items.last().index : 0;
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
      this.keyPool.release(items.last().key);
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
    if (top + this.props.viewportHeight >= this.props.maxListHeight) {
      shouldComponentUpdate = false;
    }
    if (Math.abs(this.lastRenderScrollTop - top) < this.props.renderThreshold) {
      // console.log(Math.abs(this.lastRenderScrollTop - top), '<', this.props.renderThreshold);
      shouldComponentUpdate = false;
    }

    if (shouldComponentUpdate) {
      try {
        this.prerender();
      }
      catch (e) {
        console.error(e);
      }
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if (!this.props.viewportHeight && nextProps.viewportHeight) {
      try {
        this.prerender(nextProps.viewportHeight);
      }
      catch (e) {
        console.error(e);
      }
    }
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      this.state.items.length !== nextState.items.length ||
      this.state.items.every(function (item, i) {
        return nextState.items[i] === item;
      })
    );
  },

  prerenderWorker: operative({
    addTopItems: function (items, top, height, heights, targetTop, cb) {
      var index = items[0] || 0;

      var itemHeight;
      while (top > targetTop) {
        --index;
        itemHeight = heights[index];
        // log('getItemInfo', index);
        if (!itemHeight) break;
        top -= itemHeight;
        height += itemHeight;
        // log('adding item', index);
        items.unshift(index);
      }

      cb({
        items: items,
        top: top,
        height: height
      });
    },

    removeTopItems: function (items, top, height, heights, targetTop, cb) {
      var index = items[0] || 0;
      // var log = console.log.bind(console, 'removeTopItems');

      var itemHeight;
      while (top < targetTop) {
        // log('getItemInfo', index);
        itemHeight = heights[index];
        if (!itemHeight) break;
        if (top - itemHeight > targetTop) break;
        top += itemHeight;
        height -= itemHeight;
        // log('removing item', index);
        items.shift();
        index++;
      }

      cb({
        items: items,
        top: top,
        height: height
      });
    },

    addBottomItems: function (items, top, height, heights, targetBottom, cb) {
      var lastIndex = items[items.length - 1] || -1;
      var itemHeight;
      for (
        var index = lastIndex + 1;
        top + height < targetBottom;
        index++
      ) {
        itemHeight = heights[index];
        if (!itemHeight) break;
        height += itemHeight;
        items.push(index);
      }

      cb({
        items: items,
        height: height
      });
    },

    removeBottomItems: function (items, top, height, heights, targetBottom, cb) {
      var lastIndex = items[items.length - 1] || -1;
      var itemHeight;
      for (
        var index = lastIndex;
        top + height > targetBottom;
        index--
      ) {
        itemHeight = heights[index];
        if (!itemHeight) break;
        if (top + height - itemHeight < targetBottom) break;
        height -= itemHeight;
        items.pop();
      }

      cb({
        items: items,
        height: height
      });
    }
  }),

  prerender: function (viewportHeight) {
    // console.log('PRE RENDER');
    // process.nextTick(function () {
    //   viewportHeight = viewportHeight || this.props.viewportHeight;

    //   var scrollTop = this.scrollTop;
    //   var targetTop = Math.max(scrollTop - this.props.safetyZoneSize, 0);
    //   var targetBottom = scrollTop + viewportHeight + this.props.safetyZoneSize;

    //   var items = this.state.items;

    //   if (this.itemsTop > targetTop) {
    //     items = this.addTopItems(items, targetTop);
    //   }
    //   else {
    //     items = this.removeTopItems(items, targetTop);
    //   }

    //   if (this.itemsTop + this.itemsHeight > targetBottom) {
    //     items = this.removeBottomItems(items, targetBottom);
    //   }
    //   else {
    //     items = this.addBottomItems(items, targetBottom);
    //   }

    //   this.setState({
    //     items: items
    //   });
    // }.bind(this));
    viewportHeight = viewportHeight || this.props.viewportHeight;
    var scrollTop = this.scrollTop;
    var targetTop = Math.max(scrollTop - this.props.safetyZoneSize, 0);
    var targetBottom = scrollTop + viewportHeight + this.props.safetyZoneSize;

    // console.log('targetTop', targetTop, 'targetBottom', targetBottom);

    var bottomCb = function (result) {
      this.itemsHeight = (result && result.height !== void 0) ? result.height : this.itemsHeight;
      this.setState({
        items: result.items
      });
    }.bind(this);

    var topCb = function (result) {
      this.itemsTop = (result && result.top !== void 0) ? result.top : this.itemsTop;
      this.itemsHeight = (result && result.height !== void 0) ? result.height : this.itemsHeight;
      var items = (result && result.items !== void 0) ? result.items : this.state.items;
      if (this.itemsTop + this.itemsHeight > targetBottom) {
        this.prerenderWorker.removeBottomItems(
          items,
          this.itemsTop,
          this.itemsHeight,
          this.props.itemHeights,
          targetBottom,
          bottomCb
        );
      }
      else {
        this.prerenderWorker.addBottomItems(
          items,
          this.itemsTop,
          this.itemsHeight,
          this.props.itemHeights,
          targetBottom,
          bottomCb
        );
      }
    }.bind(this);

    if (top > targetTop) {
      this.prerenderWorker.addTopItems(
        this.state.items,
        this.itemsTop,
        this.itemsHeight,
        this.props.itemHeights,
        this.targetTop,
        topCb
      );
    }
    else if (top < targetTop) {
      this.removeTopItems.removeTopItems(
        this.state.items,
        this.itemsTop,
        this.itemsHeight,
        this.props.itemHeights,
        this.targetTop,
        topCb
      );
    }
    else {
      topCb();
    }

  },

  render: function () {
    // console.info('RENDER');
    var getItem = this.props.getItem;

    var topFillerHeight = Math.max(this.itemsTop, 0);
    var bottomFillerHeight = Math.max(
      this.props.maxListHeight - this.itemsTop - this.itemsHeight,
      0
    );

    this.lastRenderScrollTop = this.scrollTop;

    return (
      <div key="inifinite-list" className="InfiniteList">
        <div key="top-filler" style={{height: topFillerHeight}} />
        <div key="content">
          {
            this.state.items
              .map(function (item) { return getItem(item); })
          }
        </div>
        <div key="bottom-filler" style={{height: bottomFillerHeight}} />
      </div>
    );
  }
});

var InifiniteScroller = React.createClass({

  getDefaultProps: function () {
    return {
      itemHeights: []
    };
  },

  componentDidMount: function () {
    this.scrollerHeight = this.getDOMNode().clientHeight;
    this.forceUpdate();
  },

  handleScroll: function (left, top) {
    this.refs['inifinite-list'].handleScroll(left, top);
  },

  handleDimensionsChange: function () {
    console.warn('handleDimensionsChange');
    this.refs.scroller.setDimensions.apply(null, arguments);
  },

  render: function () {
    console.info('InifiniteScroller', 'render');
    var maxListHeight = this.props.itemHeights.reduce(
      function (total, height) {
        return total + height;
      },
      0
    );
    return (
      <SimpleScroller
        {...this.props}
        key="scroller"
        ref="scroller"
        setChildrenScrollProps={true}
        onScroll={this.handleScroll}
        contentHeight={maxListHeight} >
        <InfiniteList
          ref="inifinite-list"
          viewportHeight={this.scrollerHeight}
          renderThreshold={this.props.renderThreshold}
          getItem={this.props.getItem}
          getItemInfo={this.props.getItemInfo}
          onDimensionsChange={this.handleDimensionsChange}
          itemHeights={this.props.itemHeights}
          maxListHeight={maxListHeight} />
      </SimpleScroller>
    );
  }

});

module.exports = InifiniteScroller;
