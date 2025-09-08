// Simple test to check mileage formatting behavior
console.log("Testing mileage formatting:");

const testNumbers = [181000, 25000, 150000, 1000, 999999];

testNumbers.forEach(num => {
  console.log(`${num} -> ${num.toLocaleString()}`);
  console.log(`${num} -> ${num.toLocaleString('en-US')}`);
  console.log(`${num} -> ${num.toLocaleString('sq-AL')}`);
  console.log(`${num} -> ${num.toLocaleString('de-DE')}`);
  console.log("---");
});