# react-touch

Component library for building intertial touch applications with React.

## Browserify setup

This library use the ```react``` npm module. It is most likely that your
application also does. If this is the case, the easiest way to use react-touch
without conflict is to use ```browserify -r react -r react-touch > libs.js```
and ```browserify -x react -x react-touch > bundle.js```. Be sure to include
```libs.js``` before ```bundle.js```.
