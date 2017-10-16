babel-plugin-console-perf
=========================


A babel plugin to assist in improving JS code performance. I got this
idea when browing documentation on various `console` methods, and
discovered that there's a `console.profile` function that automatically
starts and stops the JavaScript profiler for a particular region inside
the function. I wanted to make this as seamless as possible.


How this works
--------------

This plugin looks for the comment `// profile`, maps out the function
region and does a couple of things:

1. adds a `console.profile(<function identifier>)` method to the start of the function
2. adds a `console.profileEnd()` right before the end of the function

If there are `return` statements, it checks to see if there are
statements/expressions there, and then re-assigns them to variables and
returns the variable instead. This ensures that the
statements/expressions are also profiled. For instance:


```javascript

function getHash () {
  // profile
  const a = 42;

  return heavyCryptoFunction({ key: a });
}

```

gets converted to:


```javascript

function getHash () {
  console.profile('getHash');
  const a = 42;

  const hash = heavyCryptoFunction({ key: a});
  console.profileEnd();
  return hash;
}

```

instead of:

```javascript
function getHash () {
  console.profile('getHash');
  const a = 42;

  console.profileEnd();
  return heavyCryptoFunction({ key: a });
}
```

which misses out on profiling a potentially CPU-heavy function.
