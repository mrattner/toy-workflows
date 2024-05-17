import { Console } from 'node:console';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

type GraphNode = {
    start?: true;
    edges: Record<string, number>;
};
type Graph = Record<string, GraphNode>;

class GraphWalker {
    constructor(
        private readonly graph: Graph,
        private readonly logger: Console,
        private readonly sleep: typeof setTimeout,
    ) {}

    public async walk(): Promise<void> {
        await this.sleep(2000);
        this.logger.log('Hello, World');
        await this.sleep(5000);
        this.logger.error('Goodbye, World');
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
