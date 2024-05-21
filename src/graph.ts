import { Console } from 'node:console';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

type GraphNode = {
    start?: true;
    edges: Record<string, number>;
};
type Graph = Record<string, GraphNode>;
type NodeVisit = {
    name: string;
    ttl: number;
    nextNodes: [string, number][];
};

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
        const nodes = Object.entries(this.graph);
        const root = nodes?.find(([, { start }]) => Boolean(start));
        if (nodes.length === 0) {
            return;
        }
        if (!root) {
            throw new Error('Must have node with "start": true');
        }
        const toVisit: NodeVisit[] = [
            {
                name: root[0],
                nextNodes: Object.entries(root[1].edges),
                ttl: Date.now(),
            },
        ];
        while (toVisit.length > 0) {
            const nextNode = toVisit.pop()!;
            const now = new Date();
            const { name, ttl, nextNodes } = nextNode;
            if (now.getTime() < ttl) {
                toVisit.unshift(nextNode);
                await this.sleep();
                continue;
            }
            this.logger.log(stringify(now), name);
            for (const [nextName, waitSeconds] of nextNodes) {
                const nextToVisit = this.validateEdges(nextName);
                toVisit.unshift({
                    name: nextName,
                    ttl: now.getTime() + waitSeconds * 1000,
                    nextNodes: Object.entries(nextToVisit),
                });
            }
        }
    }

    private validateEdges(nodeName: string): GraphNode['edges'] {
        if (!(nodeName in this.graph)) {
            throw new Error(`Node "${nodeName}" does not exist`);
        }
        const edges = this.graph[nodeName].edges;
        if (typeof edges !== 'object') {
            throw new Error(
                `Node ${nodeName} "edges" property is not an object`,
            );
        }
        return edges;
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
