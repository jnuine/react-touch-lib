BIN = ./node_modules/.bin
PATH := $(BIN):$(PATH)

LIBDIR = lib
SRCDIR = src

SRCFILES_JS = $(shell find $(SRCDIR) -name "*.js" -not -name "*.react.js")
LIBFILES_JS = $(SRCFILES_JS:$(SRCDIR)%=$(LIBDIR)%)

SRCFILES_JSX = $(shell find $(SRCDIR) -name "*.react.js")
LIBFILES_JSX = $(SRCFILES_JSX:$(SRCDIR)%.react.js=$(LIBDIR)%.js)

.PHONY: build clean

build: $(LIBFILES_JS) $(LIBFILES_JSX) | $(LIBDIR)

clean:
	@rm -fr lib/

$(LIBDIR):
	@mkdir $@

$(LIBDIR)/%.js: $(SRCDIR)/%.react.js
	@echo Compiling and copying $< to $@
	@mkdir -p $(dir $@)
	@jsxc $< > $@

$(LIBDIR)/%.js: $(SRCDIR)/%.js
	@echo Copying $< to $@
	@mkdir -p $(dir $@)
	@cp $< $@

# notes & reminders:
#		$@ = target
#		$^ = dependency list
#		$< = first dependency
#		$* = name of file without suffix