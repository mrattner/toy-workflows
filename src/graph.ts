import { Console } from 'node:console';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

type GraphNode = {
    start?: true;
    edges: Record<string, number>;
};
type Graph = Record<string, GraphNode>;

const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    timeZone: 'America/Los_Angeles',
    hour12: false,
});
const stringify = (date: Date) => `[${formatter.format(date)}]`;

class GraphWalker {
    constructor(
        private readonly graph: Graph,
        private readonly logger: Console,
        private readonly sleep: typeof setTimeout,
    ) {}

    public async walk(): Promise<void> {
        await this.sleep(2000);
        this.logger.log(stringify(new Date()), 'Hello, World');
        await this.sleep(5000);
        this.logger.error(stringify(new Date()), 'Goodbye, World');
    }
}

export async function main(
    filename: string,
    logger = new Console({ stdout: process.stdout, stderr: process.stderr }),
    sleep = setTimeout,
): Promise<void> {
    const contents = await readFile(filename, { encoding: 'utf8' });
    const graph = JSON.parse(contents) as Graph;
    const walker = new GraphWalker(graph, logger, sleep);
    await walker.walk();
}
