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

function validEdges(edges: unknown): NodeVisit['nextNodes'] {
    if (typeof edges !== 'object' || !edges) {
        throw new Error('"edges" property of each node must be an object');
    }
    return Object.entries(edges).filter(([edge, weight]) => {
        if (typeof weight !== 'number') {
            return false;
        }
        if (weight < 0) {
            throw new Error(`Edge weight for ${edge} is negative`);
        }
        return true;
    });
}

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
                nextNodes: validEdges(root[1].edges),
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
                const nextToVisit = this.validateNode(nextName);
                toVisit.unshift({
                    name: nextName,
                    ttl: now.getTime() + waitSeconds * 1000,
                    nextNodes: Object.entries(nextToVisit),
                });
            }
        }
    }

    private validateNode(nodeName: string): GraphNode['edges'] {
        if (!(nodeName in this.graph)) {
            throw new Error(`Node "${nodeName}" does not exist`);
        }
        const { edges, start } = this.graph[nodeName];
        if (start) {
            throw new Error(
                `Graph may not contain more than one root: ${nodeName}`,
            );
        }
        validEdges(edges);
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
