var noop = function () { return null; };
var helpers = {
  LINEAR: {
    side: {
      translate: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        return { x: contentWidth - scrollLeft };
      },
      opacity: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        return 0.5 + 0.5 * (scrollLeft / breakpoint);
      }
    },
    content: {
      translate: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        console.log('content translate:', { x: -scrollLeft });
        return { x: - scrollLeft };
      },
      opacity: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        return 0.5 + 0.5 * (1 - scrollLeft / breakpoint);
      }
    }
  },
  PARALLAX: {
    side: {
      translate: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        var stop = 0.5 * (breakpoint + sideWidth);
        var stopRatio = scrollLeft / breakpoint;
        return { x: contentWidth - Math.pow(stopRatio, 2) * stop };
      },
      opacity: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        var stop = 0.5 * (breakpoint + sideWidth);
        var stopRatio = scrollLeft / breakpoint;
        return 0.5 + 0.5 * (Math.pow(stopRatio, 2) * stop / breakpoint);
      }
    },
    content: {
      translate: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        return { x: - scrollLeft };
      },
      opacity: function (contentWidth, sideWidth, breakpoint, scrollLeft) {
        return 0.5 + 0.5 * (1 - scrollLeft / breakpoint);
      }
    }
  }
};

var SimpleSwipeBehaviors = {
  LINEAR_FADE: {
    side: {
      translate: helpers.LINEAR.side.translate,
      rotate: noop,
      opacity: helpers.LINEAR.side.opacity
    },
    content: {
      translate: helpers.LINEAR.content.translate,
      rotate: noop,
      opacity: helpers.LINEAR.content.opacity
    }
  },
  LINEAR: {
    side: {
      translate: helpers.LINEAR.side.translate,
      rotate: noop,
      opacity: noop
    },
    content: {
      translate: helpers.LINEAR.content.translate,
      rotate: noop,
      opacity: noop
    }
  },
  LINEAR_CONTENT_ONLY: {
    side: {
      translate: noop,
      rotate: noop,
      opacity: noop
    },
    content: {
      translate: helpers.LINEAR.content.translate,
      rotate: noop,
      opacity: noop
    }
  },
  PARALLAX_FADE: {
    side: {
      translate: helpers.PARALLAX.side.translate,
      rotate: noop,
      opacity: helpers.PARALLAX.side.opacity
    },
    content: {
      translate: helpers.PARALLAX.content.translate,
      rotate: noop,
      opacity: helpers.PARALLAX.content.opacity
    }
  },
  PARALLAX: {
    side: {
      translate: helpers.PARALLAX.side.translate,
      rotate: noop,
      opacity: noop
    },
    content: {
      translate: helpers.PARALLAX.content.translate,
      rotate: noop,
      opacity: noop
    }
  }
};

module.exports = SimpleSwipeBehaviors;