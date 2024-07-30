// https://shaky.sh/fluent-interfaces-in-typescript/
function pipe(fn) {
  console.log("pipe outer", fn.toString());
  function run(a) {
    console.log("pipe inner");
    return fn(a);
  }
  run.pipe = (fn2) => {
    console.log("pipe inner 2");
    console.log("fn2", fn2.toString());
    console.log("fn", fn.toString());
    console.log("\n");
    return pipe((a) => fn2(fn(a)));
  };
  return run;
}
// const stringToDateAndTime = pipe(Date.parse)
//   .pipe((n) => new Date(n))
//   .pipe((d) => d.toISOString())
//   .pipe((s) => s.split("T"))
//   .pipe((a) => ({ date: a[0], time: a[1] }));

// const result = stringToDateAndTime("Jan 1, 2024");
// console.log(result);

const testString = pipe(Date.parse)
  .pipe((n) => new Date(n))
  .pipe((d) => d.toString());
console.log("construido");
console.log("objeto", testString);
console.log(testString("Jan 1, 2024"));
