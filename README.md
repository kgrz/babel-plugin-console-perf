babel-plugin-console-perf
=========================


A babel plugin to simplifies the usage of profiling in JS functions. I
got this idea when browsing documentation on various `console` methods,
and discovered that there's a `console.profile/profileEnd` function that
automatically starts and stops the JavaScript profiler for a particular
region inside the function. I wanted to make this as seamless as
possible.

**Note: Alpha quality program. Use with caution, and _never_ use this
to production**


Usage
-----


1. Install the plugin using `npm install --save-dev babel-plugin-console-perf`
2. Add the plugin `console-perf` to your `.babelrc`
3. Add a comment `// profile` in the function you want to profile
4. Open the JS console in your browser, and navigate to the profiling
   tab. Note that on latest Chrome (Canary is what I generally use) the
   tool has been moved into the "more tools" section. This is not the
   Performance tab, by the way.
5. Load the page which calls the function where you added comment.


That should record individual profiles for each of the runs in case the
function gets called multiple times.

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


----------------


Checkout other `console`-based plugins that I wrote:

[babel-plugin-console-groupify](https://github.com/kgrz/babel-plugin-console-groupify)

[babel-plugin-transform-console-log-variable-names](https://github.com/kgrz/babel-plugin-transform-console-log-variable-names)
