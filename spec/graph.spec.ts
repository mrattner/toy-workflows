import { Console } from 'node:console';
import Path from 'node:path';
import { PassThrough } from 'node:stream';
import { main } from '../src/graph';

const fakeNow = new Date('2023-05-21T16:00:00.000Z');
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

    it('prints to stdout and stderr with fake timer', async () => {
        await main(testFile('simple.json'), logger, sleep);

        expect(error.calls.allArgs()).toEqual([['Goodbye, World']]);
        expect(log.calls.allArgs()).toEqual([['Hello, World']]);
    });
});
