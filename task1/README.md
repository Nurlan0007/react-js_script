# JavaScript Runtime & Asynchronous Concepts Deep Dive

## 1. How Closures Keep Task Counters Private
In JavaScript, a closure is created whenever a inner function retains lexical access to variables declared in its outer scope, even after the outer function has finished executing.

In our implementation:
```javascript
function createTask(taskName) {
  let count = 0; // Private variable encapsulated in outer scope

  return {
    run: function() { count++; },
    getCount: function() { return count; }
  };
}