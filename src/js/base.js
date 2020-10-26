const debounce = (func, delay = 250) => {
  let timeout = null;
  return () => {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
};
export { debounce };
