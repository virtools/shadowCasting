const cropNumber = (val, min = 0, max = 1) => {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
};

export { cropNumber };
