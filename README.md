# Task Runner

A toy workflow runner that prints the names of nodes in a DAG, with edge weights
representing the number of seconds to wait before printing the next node.

## Running the code

Requires NodeJS to be installed on the system, version 18 (LTS) or higher. It
must be compiled with TSC before running; its two dependencies are TypeScript
(for compilation) and Jasmine (test runner). The optional dependencies are just
an auto-formatter and file watcher, not needed for testing the program.

    npm install --no-optional
    npm run compile

The program takes a single command line argument that is the path to a JSON file
containing the DAG:

    npm start <path/to/graph.json>

To run the test suite after compilation:

    npm test

### Example graph JSON file

```json
{
    "A": { "start": true, "edges": { "B": 5, "C": 7 } },
    "B": { "edges": {} },
    "C": { "edges": {} }
}
```

### Example output

    [16:00:00.000] A
    [16:00:05.123] B
    [16:00:07.456] C

## Implementation notes

1. Start by setting up the entry point of the program for reading a given JSON
   file and keeping it in program memory as a DAG.

2. Since "wait N seconds" is the key functionality of the program, determine how
   to test with a fake timer and assert that a certain number of seconds have
   passed without actually waiting during the tests.

3. For initial functionality, assume the happy path: input file exists, is
   well-formed, has one root node, and contains no cycles. Include test cases:

    - an empty graph
    - a graph with a single node
    - a very simple graph (the given example)
    - graphs with multiple paths to several nodes
    - graphs where multiple nodes have the same elapsed time before printing
      (allow these to be printed in any order, as long as the times are close)

4. Add tests for up-front error cases:

    - nonexistent input file
    - input file is not JSON
    - no root node

5. Add tests for semantically invalid input:
    - an edge weight is negative
    - more than one root node
    - node doesn't have an `edges` member that is an `object` type

### Out of scope

To keep the implementation simple, I've decided to:

-   Assume the provided workflow is actually acyclic (no cycle detection).
-   Track calls to the console logging methods rather than examining the actual
    contents of the process's `stdout` and `stderr` (no integration tests).
-   Walk the graph only once and throw errors as the program encounters them,
    rather than parsing and validating the input beforehand.
-   Ignore any JSON object fields that don't conform to the schema, rather than
    including them as error cases.
