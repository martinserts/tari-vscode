import { NODE_ENTRY, NODE_EXIT } from "@/components/query-builder/nodes/generic-node.types";
import { GenericNode, GenericNodeType } from "@/store/types";
import { LogLevel, Type } from "@tari-project/typescript-bindings";
import { Edge } from "@xyflow/react";
import { CycleDetectedError } from "./CycleDetectedError";
import { AmbiguousOrderError } from "./AmbiguousOrderError";
import { MissingDataError } from "./MissingDataError";
import { Amount, fromWorkspace, Transaction, TransactionBuilder } from "@tari-project/tarijs-all";
import { COMPONENT_ADDRESS_NAME } from "@/query-builder/template-reader";
import { ArgValue, TransactionDescription } from "./types";

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
  ) {
    this.init();
  }

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
    const executionOrder: NodeId[] = [];
    let nodesProcessed = 0;
    const queue: NodeId[] = this.nodes
      .map((node) => node.id)
      .filter((nodeId) => this.incomingConnectionCount.get(nodeId) === 0);

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

    this.validateConnections();

    return executionOrder;
  }

  private validateConnections() {
    const inputConnections = new Set(this.edges.map((edge) => `${edge.target}:${edge.targetHandle ?? ""}`));
    const missingConnections = this.genericNodes.flatMap((node) => {
      const { id, data } = node;
      const nodeId = data.title ?? id;
      if (!data.inputs) {
        return [];
      }
      const values = data.values;
      if (!values) {
        return [nodeId];
      }
      const hasMissingParams = data.inputs.some((input) => {
        const name = input.name;
        const value = values[name];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const hasValue = value && value.success && (typeof value.data !== "string" || value.data.length);
        const missing = !hasValue && !inputConnections.has(`${id}:${name}`);
        return missing;
      });
      return hasMissingParams ? [nodeId] : [];
    });
    if (missingConnections.length) {
      throw new MissingDataError(missingConnections);
    }
  }

  public buildTransactionDescription(
    executionOrder: NodeId[],
    accountAddress: string,
    fee: Amount,
  ): TransactionDescription[] {
    const nodes = new Map(this.genericNodes.map((node) => [node.id, node]));
    const parentEdges = this.edges.filter(
      (edge) => edge.sourceHandle !== NODE_EXIT && edge.targetHandle !== NODE_ENTRY,
    );
    const childToParent = new Map(
      parentEdges.map((edge) => [`${edge.target}:${edge.targetHandle ?? ""}`, edge.source]),
    );
    const connectedParents = new Set(parentEdges.map((edge) => edge.source));

    const descriptions: TransactionDescription[] = [];
    descriptions.push({
      type: "feeTransactionPayFromComponent",
      args: [accountAddress, fee.getStringValue()],
    });
    for (const nodeId of executionOrder) {
      const node = nodes.get(nodeId);
      if (!node) {
        throw new Error(`Could not find node ${nodeId}`);
      }
      const { data } = node;
      const values = data.values;
      const allArgs =
        values && data.inputs
          ? data.inputs.map((input) => {
              const parent = childToParent.get(`${nodeId}:${input.name}`);
              const argValue: ArgValue = parent
                ? { type: "workspace", value: parent }
                : {
                    type: "other",
                    value: values[input.name].data,
                  };
              return { name: input.name, value: argValue };
            })
          : [];
      const [args, componentAddress] =
        allArgs.length && allArgs[0].name === COMPONENT_ADDRESS_NAME
          ? [allArgs.slice(1), allArgs[0].value.value]
          : [allArgs, undefined];

      switch (data.type) {
        case GenericNodeType.CallNode: {
          const metadata = data.metadata;
          if (!metadata) {
            throw new Error(`Missing metadata for node ${nodeId}`);
          }
          const argValues = args.map((arg) => arg.value);
          if (metadata.isMethod) {
            if (!componentAddress || typeof componentAddress !== "string") {
              throw new Error(`Component address is not set for node ${nodeId}`);
            }
            descriptions.push({
              type: "callMethod",
              method: {
                componentAddress,
                methodName: metadata.fn.name,
              },
              args: argValues,
            });
          } else {
            descriptions.push({
              type: "callFunction",
              function: {
                templateAddress: metadata.templateAddress,
                functionName: metadata.fn.name,
              },
              args: argValues,
            });
          }
          break;
        }
        case GenericNodeType.EmitLogNode: {
          descriptions.push({
            type: "addInstruction",
            args: [
              {
                EmitLog: {
                  level: args[0].value.value as LogLevel,
                  message: args[1].value.value as string,
                },
              },
            ],
          });
          break;
        }
        case GenericNodeType.AssertBucketContains:
          // TODO: `Instruction` does not have this instruction yet
          break;
      }

      if (data.output && connectedParents.has(nodeId)) {
        descriptions.push({
          type: "saveVar",
          key: nodeId,
        });
      }
    }

    return descriptions;
  }

  public buildTransaction(descriptions: TransactionDescription[]): Transaction {
    const builder = new TransactionBuilder();
    for (const description of descriptions) {
      switch (description.type) {
        case "feeTransactionPayFromComponent":
          builder.feeTransactionPayFromComponent(...description.args);
          break;
        case "callMethod":
          builder.callMethod(description.method, unwrapArgValues(description.args));
          break;
        case "callFunction":
          builder.callFunction(description.function, unwrapArgValues(description.args));
          break;
        case "addInstruction":
          builder.addInstruction(...description.args);
          break;
        case "saveVar":
          builder.saveVar(description.key);
          break;
      }
    }
    return builder.build();
  }
}

function unwrapArgValue(arg: ArgValue): unknown {
  return arg.type === "workspace" ? fromWorkspace(arg.value) : arg.value;
}

function unwrapArgValues(args: ArgValue[]): unknown[] {
  return args.map(unwrapArgValue);
}
