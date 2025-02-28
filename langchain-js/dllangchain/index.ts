import path from 'path';
//process.argv returns an array containing command line arguments
// exampleName is the file path of the example we want to `run`
const [exampleName, ...args] = process.argv.slice(2);

let runExample;
try {
  ({ run: runExample } = require(path.join(__dirname, exampleName)));
} catch {
  throw new Error(`#4::Could not load example ${exampleName}`);
}
runExample();
