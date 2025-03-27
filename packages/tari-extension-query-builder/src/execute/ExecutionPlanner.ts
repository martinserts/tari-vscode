import { NODE_ENTRY, NODE_EXIT } from "@/components/query-builder/nodes/generic-node.types";
import { GenericNode } from "@/store/types";
import { Type } from "@tari-project/typescript-bindings";
import { Edge } from "@xyflow/react";
import { CycleDetectedError } from "./CycleDetectedError";
import { AmbiguousOrderError } from "./AmbiguousOrderError";

type NodeId = string;
interface Node {
  id: NodeId;
  exitPoint?: NodeId;
  enterPoint?: NodeId;
  outputParameter?: { type: Type };
  inputParameters?: Record<string, { type: Type; source?: NodeId }>;
}

export class ExecutionPlanner {
  private nodes: Node[] = [];
  private nodeMap = new Map<NodeId, Node>();
  private incomingConnectionCount = new Map<NodeId, number>();
  private outgoingConnections = new Map<NodeId, NodeId[]>();
  private outputToInputDependencies = new Map<NodeId, NodeId[]>();

  constructor(
    private genericNodes: GenericNode[],
    private edges: Edge[],
  ) {}

  private adjustIncomingConnectionCount(nodeId: NodeId, delta: number) {
    this.incomingConnectionCount.set(nodeId, (this.incomingConnectionCount.get(nodeId) ?? 0) + delta);
  }

  private addOutgoingConnection(sourceNodeId: NodeId, targetNodeId: NodeId) {
    const out = this.outgoingConnections.get(sourceNodeId);
    if (out) {
      out.push(targetNodeId);
    }
  }

  private mapGenericNode(node: GenericNode): Node {
    const inputParameters: Node["inputParameters"] | undefined = node.data.inputs
      ? Object.fromEntries(node.data.inputs.map((input) => [input.name, { type: input.type }]))
      : undefined;
    return {
      id: node.id,
      outputParameter: node.data.output ? { type: node.data.output.type } : undefined,
      inputParameters,
    };
  }

  private processEdges() {
    for (const edge of this.edges) {
      const source = this.nodeMap.get(edge.source);
      const target = this.nodeMap.get(edge.target);
      if (!source || !target || !edge.sourceHandle || !edge.targetHandle) {
        continue;
      }

      if (edge.sourceHandle === NODE_EXIT && edge.targetHandle === NODE_ENTRY) {
        source.exitPoint = target.id;
        target.enterPoint = source.id;
      } else {
        const inputParameter = target.inputParameters?.[edge.targetHandle];
        if (inputParameter) {
          inputParameter.source = source.id;
        }
      }
    }
  }

  private buildOutputToInputDependencies() {
    for (const node of this.nodes) {
      if (node.outputParameter) {
        this.outputToInputDependencies.set(node.id, []);
      }
      if (node.inputParameters) {
        for (const paramName in node.inputParameters) {
          const sourceNodeId = node.inputParameters[paramName].source;
          if (sourceNodeId) {
            if (!node.exitPoint || node.exitPoint !== sourceNodeId) {
              this.addOutgoingConnection(sourceNodeId, node.id);
              this.adjustIncomingConnectionCount(node.id, 1);
              const deps = this.outputToInputDependencies.get(sourceNodeId);
              if (deps) {
                deps.push(node.id);
              }
            }
          }
        }
      }
      if (node.exitPoint) {
        this.addOutgoingConnection(node.id, node.exitPoint);
        this.adjustIncomingConnectionCount(node.exitPoint, 1);
      }
    }
  }

  private init() {
    this.nodes = this.genericNodes.map((node) => this.mapGenericNode(node));
    this.nodeMap = new Map(this.nodes.map((node) => [node.id, node]));
    this.outputToInputDependencies = new Map();
    this.incomingConnectionCount = new Map(this.nodes.map((node) => [node.id, 0]));
    this.outgoingConnections = new Map(this.nodes.map((node) => [node.id, []]));

    this.processEdges();
    this.buildOutputToInputDependencies();
  }

  private outputDependsOnInput(outputNodeId: NodeId, inputNodeId: NodeId): boolean {
    const deps = this.outputToInputDependencies.get(outputNodeId);
    return deps ? deps.includes(inputNodeId) : false;
  }

  private explicityFollows(outputNodeId: NodeId, inputNodeId: NodeId): boolean {
    return this.nodeMap.get(outputNodeId)?.enterPoint === inputNodeId;
  }

  public getExecutionOrder(): NodeId[] {
    this.init();

    const queue: NodeId[] = this.nodes
      .map((node) => node.id)
      .filter((nodeId) => this.incomingConnectionCount.get(nodeId) === 0);

    const executionOrder: NodeId[] = [];
    let nodesProcessed = 0;

    while (queue.length > 0) {
      if (queue.length > 1) {
        // Check for non-determinism
        for (let i = 0; i < queue.length; i++) {
          for (let j = i + 1; j < queue.length; j++) {
            const node1Id = queue[i];
            const node2Id = queue[j];

            const dependsOn1 = this.outputDependsOnInput(node2Id, node1Id);
            const dependsOn2 = this.outputDependsOnInput(node1Id, node2Id);

            const explicitlyFollows1 = this.explicityFollows(node2Id, node1Id);
            const explicitlyFollows2 = this.explicityFollows(node1Id, node2Id);

            if (!dependsOn1 && !dependsOn2 && !explicitlyFollows1 && !explicitlyFollows2) {
              throw new AmbiguousOrderError(node1Id, node2Id);
            }
          }
        }
      }

      const currentNodeId = queue.shift();
      if (!currentNodeId) {
        continue;
      }
      executionOrder.push(currentNodeId);
      nodesProcessed++;

      const neighbors = this.outgoingConnections.get(currentNodeId) ?? [];
      for (const neighborId of neighbors) {
        this.adjustIncomingConnectionCount(neighborId, -1);
        if (this.incomingConnectionCount.get(neighborId) === 0) {
          queue.push(neighborId);
        }
      }
    }

    if (nodesProcessed !== this.nodes.length) {
      throw new CycleDetectedError();
    }

    return executionOrder;
  }
}
