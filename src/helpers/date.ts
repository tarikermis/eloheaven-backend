export const getDaysArray = (
  start: string | number | Date,
  end: string | number | Date,
) => {
  const arr = []; // Declare the variable 'arr'
  for (
    const dt = new Date(start);
    dt <= new Date(end);
    dt.setDate(dt.getDate() + 1)
  ) {
    arr.push(new Date(dt));
  }
  return arr;
};
