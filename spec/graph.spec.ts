import { Console } from 'node:console';
import Path from 'node:path';
import { PassThrough } from 'node:stream';
import { main } from '../src/graph';

const fakeNow = new Date('2023-05-21T16:00:00.000-07:00');
const logger = new Console(new PassThrough(), new PassThrough());

async function sleep<T = void>(milliseconds?: number): Promise<T> {
    jasmine.clock().tick(milliseconds ?? 0);
    return Promise.resolve(undefined as T);
}

const testFile = (filename: string) =>
    Path.join(__dirname, '..', '..', 'spec', 'input', filename);

describe('graph.main', () => {
    let log: jasmine.Spy;
    let error: jasmine.Spy;

    beforeAll(() => {
        log = spyOn(logger, 'log');
        error = spyOn(logger, 'error');
    });

    beforeEach(() => {
        jasmine.clock().install();
        jasmine.clock().mockDate(fakeNow);
    });

    afterEach(() => {
        log.calls.reset();
        error.calls.reset();
        jasmine.clock().uninstall();
    });

    describe('syntax errors', () => {
        it('throws error when input file does not exist', async () => {
            await expectAsync(
                main(testFile('nonexistent'), logger, sleep),
            ).toBeRejectedWithError(/no such file or directory/);
        });

        it('throws error when input is not JSON', async () => {
            await expectAsync(
                main(testFile('err_not-json.txt'), logger, sleep),
            ).toBeRejectedWithError(/JSON/);
        });

        it('throws error when input graph has no root node', async () => {
            await expectAsync(
                main(testFile('err_no-root.json'), logger, sleep),
            ).toBeRejectedWithError(/"start"/);
        });
    });

    describe('semantic errors', () => {
        it('throws error when more than one root node in graph', async () => {
            await expectAsync(
                main(testFile('err_extra-root.json'), logger, sleep),
            ).toBeRejectedWithError(/more than one root/);
        });

        it('throws error when "edges" is not an object', async () => {
            await expectAsync(
                main(testFile('err_invalid-edges.json'), logger, sleep),
            ).toBeRejectedWithError(/"edges"/);
        });

        it('throws error when edge has negative weight', async () => {
            await expectAsync(
                main(testFile('err_negative-edge.json'), logger, sleep),
            ).toBeRejectedWithError(/negative/);
        });

        it('throws error when edge refers to nonexistent node', async () => {
            await expectAsync(
                main(testFile('err_nonexistent-node.json'), logger, sleep),
            ).toBeRejectedWithError(/"D" does not exist/);
        });
    });

    describe('simple graphs', () => {
        it('prints nothing for empty graph', async () => {
            await main(testFile('no-nodes.json'), logger, sleep);

            expect(error).not.toHaveBeenCalled();
            expect(log).not.toHaveBeenCalled();
        });

        it('prints only the root for graph with 1 node', async () => {
            await main(testFile('one-node.json'), logger, sleep);

            expect(error).not.toHaveBeenCalled();
            expect(log.calls.allArgs()).toEqual([['[16:00:00.000]', 'A']]);
        });

        describe('graph with 3 nodes and all different edge weights', () => {
            beforeEach(async () => {
                await main(testFile('simple.json'), logger, sleep);
            });

            it('takes 7 seconds to run', () => {
                expect(new Date().getTime() / 1000).toBeCloseTo(
                    (fakeNow.getTime() + 7000) / 1000,
                );
            });

            it('prints the nodes in order', () => {
                expect(error).not.toHaveBeenCalled();
                expect(log.calls.allArgs()).toEqual([
                    ['[16:00:00.000]', 'A'],
                    [jasmine.stringContaining('16:00:05'), 'B'],
                    [jasmine.stringContaining('16:00:07'), 'C'],
                ]);
            });
        });
    });

    describe('graph example 1', () => {
        beforeEach(async () => {
            await main(testFile('nine-nodes.json'), logger, sleep);
        });

        it('visits nodes the correct number of times', () => {
            expect(error).not.toHaveBeenCalled();
            expect(log).toHaveBeenCalledTimes(18);
        });

        it('takes 16 seconds to run', () => {
            expect(new Date().getTime() / 1000).toBeCloseTo(
                (fakeNow.getTime() + 16000) / 1000,
            );
        });

        it('prints root immediately', () => {
            expect(log.calls.argsFor(0)).toEqual(['[16:00:00.000]', 'A']);
        });

        it('prints G after 1 second', () => {
            expect(log.calls.argsFor(1)).toEqual([
                jasmine.stringContaining('16:00:01'),
                'G',
            ]);
        });

        it('prints B after 2 seconds', () => {
            expect(log.calls.argsFor(2)).toEqual([
                jasmine.stringContaining('16:00:02'),
                'B',
            ]);
        });

        it('prints D, E, and F after 6 seconds', () => {
            const nodes = log.calls.allArgs().slice(3, 6);
            const sixSeconds = jasmine.stringContaining('16:00:06');

            expect(nodes).toContain([sixSeconds, 'D']);
            expect(nodes).toContain([sixSeconds, 'E']);
            expect(nodes).toContain([sixSeconds, 'F']);
        });

        it('prints C after 7 seconds', () => {
            expect(log.calls.argsFor(6)).toEqual([
                jasmine.stringContaining('16:00:07'),
                'C',
            ]);
        });

        it('prints C, G, and H after 8 seconds', () => {
            const nodes = log.calls.allArgs().slice(7, 10);
            const eightSeconds = jasmine.stringContaining('16:00:08');

            expect(nodes).toContain([eightSeconds, 'C']);
            expect(nodes).toContain([eightSeconds, 'G']);
            expect(nodes).toContain([eightSeconds, 'H']);
        });

        it('prints H after 9 seconds', () => {
            expect(log.calls.argsFor(10)).toEqual([
                jasmine.stringContaining('16:00:09'),
                'H',
            ]);
        });

        it('prints F after 10 seconds', () => {
            expect(log.calls.argsFor(11)).toEqual([
                jasmine.stringContaining('16:00:10'),
                'F',
            ]);
        });

        it('prints F and I after 11 seconds', () => {
            const nodes = log.calls.allArgs().slice(12, 14);
            const elevenSeconds = jasmine.stringContaining('16:00:11');

            expect(nodes).toContain([elevenSeconds, 'F']);
            expect(nodes).toContain([elevenSeconds, 'I']);
        });

        it('prints F and H after 13 seconds', () => {
            const nodes = log.calls.allArgs().slice(14, 16);
            const thirteenSeconds = jasmine.stringContaining('16:00:13');

            expect(nodes).toContain([thirteenSeconds, 'F']);
            expect(nodes).toContain([thirteenSeconds, 'H']);
        });

        it('prints H after 14 seconds', () => {
            expect(log.calls.argsFor(16)).toEqual([
                jasmine.stringContaining('16:00:14'),
                'H',
            ]);
        });

        it('prints H after 16 seconds', () => {
            expect(log.calls.argsFor(17)).toEqual([
                jasmine.stringContaining('16:00:16'),
                'H',
            ]);
        });
    });

    describe('graph example 2', () => {
        beforeEach(async () => {
            await main(testFile('fancy-graph.json'), logger, sleep);
        });

        it('visits nodes the correct number of times', () => {
            expect(error).not.toHaveBeenCalled();
            expect(log).toHaveBeenCalledTimes(18);
        });

        it('takes 12 seconds to run', () => {
            expect(new Date().getTime() / 1000).toBeCloseTo(
                (fakeNow.getTime() + 12000) / 1000,
            );
        });

        it('prints root immediately', () => {
            expect(log.calls.argsFor(0)).toEqual(['[16:00:00.000]', 'A']);
        });

        it('prints B2 after 1 second', () => {
            expect(log.calls.argsFor(1)).toEqual([
                jasmine.stringContaining('16:00:01'),
                'B2',
            ]);
        });

        it('prints C4 after 2 seconds', () => {
            expect(log.calls.argsFor(2)).toEqual([
                jasmine.stringContaining('16:00:02'),
                'C4',
            ]);
        });

        it('prints B3, C5, and C6 after 5 seconds', () => {
            const nodes = log.calls.allArgs().slice(3, 6);
            const fiveSeconds = jasmine.stringContaining('16:00:05');

            expect(nodes).toContain([fiveSeconds, 'B3']);
            expect(nodes).toContain([fiveSeconds, 'C5']);
            expect(nodes).toContain([fiveSeconds, 'C6']);
        });

        it('prints C7 after 6 seconds', () => {
            expect(log.calls.argsFor(6)).toEqual([
                jasmine.stringContaining('16:00:06'),
                'C7',
            ]);
        });

        it('prints B1 and C8 after 7 seconds', () => {
            const nodes = log.calls.allArgs().slice(7, 9);
            const sevenSeconds = jasmine.stringContaining('16:00:07');

            expect(nodes).toContain([sevenSeconds, 'B1']);
            expect(nodes).toContain([sevenSeconds, 'C8']);
        });

        it('prints B3 and C2 after 8 seconds', () => {
            const nodes = log.calls.allArgs().slice(9, 11);
            const eightSeconds = jasmine.stringContaining('16:00:08');

            expect(nodes).toContain([eightSeconds, 'B3']);
            expect(nodes).toContain([eightSeconds, 'C2']);
        });

        it('prints C7 twice, and C3 after 9 seconds', () => {
            const nodes = log.calls.allArgs().slice(11, 14);

            expect(nodes).toContain([
                jasmine.stringContaining('16:00:09'),
                'C3',
            ]);

            const c7Count = nodes.reduce((count, next) => {
                return /\[16:00:09\.\d{3}\]/.test(next[0]) && next[1] === 'C7'
                    ? count + 1
                    : count;
            }, 0);
            expect(c7Count).toEqual(2);
        });

        it('prints C1 and C8 after 10 seconds', () => {
            const nodes = log.calls.allArgs().slice(14, 16);
            const tenSeconds = jasmine.stringContaining('16:00:10');

            expect(nodes).toContain([tenSeconds, 'C1']);
            expect(nodes).toContain([tenSeconds, 'C8']);
        });

        it('prints C4 after 11 seconds', () => {
            expect(log.calls.argsFor(16)).toEqual([
                jasmine.stringContaining('16:00:11'),
                'C4',
            ]);
        });

        it('prints C7 after 12 seconds', () => {
            expect(log.calls.argsFor(17)).toEqual([
                jasmine.stringContaining('16:00:12'),
                'C7',
            ]);
        });
    });
});
