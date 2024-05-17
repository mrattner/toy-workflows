const { main } = require('./dist/src/graph');

if (process.argv.length < 2) {
    console.error(
        'missing required argument <graph-file>',
        process.argv,
        process.argv.length,
    );
    process.exit(1);
}

main(process.argv[2]).catch((e) => {
    console.error(e);
    process.exit(1);
});
