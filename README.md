# Coroutines

This is a coroutine library built on generators, and inspired by Unity's coroutines implementation.

It's based on the implementations in my [experiments repo](https://github.com/alduino/experiments).

## Features

- [Nesting support](#nesting), with stack traces
- [Waiting until a condition](#awaiters)
- Frontend-agnostic
- [Basic mutex support](#focus-targets)

### Awaiters

In this library, an 'awaiter' is a value that, when `yield`ed in a coroutine, causes the coroutine to wait until some condition passes. For example, it could be waiting until the user clicks with their mouse, or until some amount of time has passed.

```javascript
coroutineManager.startCoroutine(function *handleMouse() {
    while (true) {
        yield waitUntil.mousePressed();
        console.log("clicked!");
    }
});
```

Technically, an awaiter is an object with a `shouldContinue` method, which is called every tick. Once this method returns `{done: true}`, control is passed back to the coroutine.

There are a few built-in awaiters that implement common tasks (for example, `waitUntil.nextTick`). Generally, however, awaiters are implemented by the framework that runs the coroutines, as they are generally framework-dependent.

### Nesting

Nesting is very important in making reusable code so it's supported in this library. To nest, simply `yield` a generator function, which will cause the parent coroutine to wait until the child exits. If you want to have the function defined somewhere else and pass it parameters, create a wrapper that takes the parameters and returns a generator function.

> **Warning**
>
> You must yield a generator **function**, not the generator iterator.
>
> For example, with `function *generator() {}`, you must `yield generator`, instead of `yield generator()`. The function is called internally.

```javascript
coroutineManager.startCoroutine(function *handleMouse() {
    const {ctx} = yield waitUntil.mousePressed();
    
    // returns once the sparkles have gone away
    yield showSparkles(ctx.mouseX, ctx.mouseY);
});

function showSparkles(x, y) {
    return function*() {
        // ...
    };
}
```

> **Note**
>
> You can also yield a `Coroutine` instance, which allows you to set a custom identifier if needed. See the `AwaiterCastable` type for an up-to-date list of everything you can yield.

If you need to run multiple nested coroutines at the same time, there are a few helper functions to make this possible:

- `waitUntil.one([...awaiters])`: Waits until any one of the awaiters completes, returning when it does. The `data` property in the result is the index of the awaiter that finished first.
- `waitUntil.all([...awaiters])`: Waits until every awaiter has completed.
- `waitUntil.nest({...})`: Lower-level nesting method allowing direct access to the result of each awaiter on each tick.

> **Note**
>
> A nested coroutine currently cannot return any data to the parent.

### Focus targets

Focus targets are a crude form of focus control built in to this library, that function similar to a mutex. A focus target can be active or inactive, and only one focus target can be active at once. If a focus target is passed to an awaiter, the coroutine will only continue (and the awaiter will only run) either if there's no active focus target, or if the passed target is the currently active one.

> **Note**
>
> Set the `require` option when creating a focus target to only allow an awaiter to run while the focus target is specifically active, instead of also when there are no focus targets active.

```javascript
coroutineManager.startCoroutine(function *handleMouse() {
	const focusTarget = coroutineManager.getFocusTargetManager().createFocusTarget();

	let focused = false;
    setInterval(() => {
        if (!focused) focusTarget.focus();
        else focusTarget.blur();
        focused = !focused;
    }, 5000);
    
    while (true) {
        yield waitUntil.mouseMoved({focusTarget});
        
        // will pause for 5s every 5s
        console.log("Mouse moved!");
    }
});
```

You can also create a focus target that combines multiple others, acting as active if any of the children are active:

```javascript
const focusTargetManager = coroutineManager.getFocusTargetManager();

const focusTargetA = focusTargetManager.createFocusTarget();
const focusTargetB = focusTargetManager.createFocusTarget();

const combined = focusTargetManager.createCombinedFocusTarget([focusTargetA, focusTargetB]);

focusTargetA.focus(); // Combined counts as focused
focusTargetA.blur(); // Combined is no longer focused
focusTargetB.focus(); // Combined is focused again
```

### Hooks

Some hooks are provided that allow you to do special things in a coroutine. To use a hook, simply call it and `yield` the result.

- `coroutineManager.hookDispose(callback)`: Yielding this will queue `callback` to be run when the coroutine stops.
- `coroutineManager.hookOptions(options)`: Sets default options for any subsequent awaiters in this coroutine (e.g. setting a focus target). Multiple calls shallow merge the value.

## Quick-start

```javascript
import {CoroutineController, waitUntil as builtInAwaiters} from "@alduino/coroutines";

// This class handles running each coroutine.
// The instance should be kept internal to your framework.
const coroutineController = new CoroutineController<FrameworkContext>();

// Super-duper quick per-frame ticks.
// The tick method goes through and runs all the waiting `shouldContinue` methods.
// The context value is passed as the `ctx` property on yield results.
setInterval(() => coroutineController.tick(getFrameworkContext()), 1000 / 60);

// This value should be exposed to the user so they can create coroutines.
const coroutineManager = coroutineController.getManager();

// Framework-dependent awaiters are also useful to provide for the user.
const waitUntil = {
    ...builtInAwaiters,
    mousePressed() { /* ... */ }
};
```

## License

This library is licensed under the MIT License. See [`LICENSE`](./LICENSE) for more info.