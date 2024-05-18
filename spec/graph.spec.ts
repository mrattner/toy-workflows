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
                expect(new Date().getTime() / 1000).toBeCloseTo((fakeNow.getTime() + 7000));
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
});
