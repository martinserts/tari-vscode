import {
  AddInstructionDescription,
  ArgValue,
  CallFunctionDescription,
  CallMethodDescription,
  FeeTransactionPayFromComponentDescription,
  SaveVarDescription,
  TransactionDescription,
} from "@/execute/types";
import * as ts from "typescript";

const factory = ts.factory;

export class BuilderCodegen {
  constructor(private readonly transactionDescriptions: TransactionDescription[]) {}

  public generateTypescriptCode(): string {
    return this.generateCode(ts.ScriptKind.TS);
  }

  public generateJavascriptCode(): string {
    const code = this.generateCode(ts.ScriptKind.TS);

    const javascript = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    });
    return javascript.outputText;
  }

  private generateCode(kind: ts.ScriptKind): string {
    const filename = kind === ts.ScriptKind.TS ? "transaction.ts" : "transaction.js";
    const file = ts.createSourceFile(filename, "", ts.ScriptTarget.ES2022, false, kind);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printList(ts.ListFormat.MultiLine, this.buildAst(), file);
    return stripEmptyComments(result);
  }

  private buildAst(): ts.NodeArray<ts.Statement> {
    return factory.createNodeArray([
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("buildTransactionRequest")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("fromWorkspace")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("Network")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("ReqSubstate")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("submitAndWaitForTransaction")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("SubmitTxResult")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("TariSigner")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("Transaction")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("TransactionBuilder")),
          ]),
        ),
        factory.createStringLiteral("@tari-project/tarijs-all"),
        undefined,
      ),
      addEmptyComment(
        factory.createFunctionDeclaration(
          undefined,
          undefined,
          factory.createIdentifier("buildTransaction"),
          undefined,
          [],
          factory.createTypeReferenceNode(factory.createIdentifier("Transaction"), undefined),
          factory.createBlock(
            [
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("builder"),
                      undefined,
                      undefined,
                      factory.createNewExpression(factory.createIdentifier("TransactionBuilder"), undefined, []),
                    ),
                  ],
                  ts.NodeFlags.Const,
                ),
              ),
              ...this.createStatements(),
              factory.createReturnStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("builder"),
                    factory.createIdentifier("build"),
                  ),
                  undefined,
                  [],
                ),
              ),
            ],
            true,
          ),
        ),
      ),
      addEmptyComment(
        factory.createFunctionDeclaration(
          [factory.createToken(ts.SyntaxKind.ExportKeyword), factory.createToken(ts.SyntaxKind.AsyncKeyword)],
          undefined,
          factory.createIdentifier("executeTransaction"),
          undefined,
          [
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("signer"),
              undefined,
              factory.createTypeReferenceNode(factory.createIdentifier("TariSigner"), undefined),
              undefined,
            ),
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("network"),
              undefined,
              factory.createTypeReferenceNode(factory.createIdentifier("Network"), undefined),
              undefined,
            ),
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("accountId"),
              undefined,
              factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
              undefined,
            ),
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("requiredSubstates"),
              undefined,
              factory.createArrayTypeNode(
                factory.createTypeReferenceNode(factory.createIdentifier("ReqSubstate"), undefined),
              ),
              factory.createArrayLiteralExpression([], false),
            ),
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("isDryRun"),
              undefined,
              undefined,
              factory.createFalse(),
            ),
          ],
          factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
            factory.createTypeReferenceNode(factory.createIdentifier("SubmitTxResult"), undefined),
          ]),
          factory.createBlock(
            [
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("submitTransactionRequest"),
                      undefined,
                      undefined,
                      factory.createCallExpression(factory.createIdentifier("buildTransactionRequest"), undefined, [
                        factory.createCallExpression(factory.createIdentifier("buildTransaction"), undefined, []),
                        factory.createIdentifier("accountId"),
                        factory.createIdentifier("requiredSubstates"),
                        factory.createIdentifier("undefined"),
                        factory.createIdentifier("isDryRun"),
                        factory.createIdentifier("network"),
                      ]),
                    ),
                  ],
                  ts.NodeFlags.Const,
                ),
              ),
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("txResult"),
                      undefined,
                      undefined,
                      factory.createAwaitExpression(
                        factory.createCallExpression(
                          factory.createIdentifier("submitAndWaitForTransaction"),
                          undefined,
                          [factory.createIdentifier("signer"), factory.createIdentifier("submitTransactionRequest")],
                        ),
                      ),
                    ),
                  ],
                  ts.NodeFlags.Const,
                ),
              ),
              factory.createReturnStatement(factory.createIdentifier("txResult")),
            ],
            true,
          ),
        ),
      ),
    ]);
  }

  private createStatements(): ts.NodeArray<ts.Statement> {
    const factory = ts.factory;
    return factory.createNodeArray(
      this.transactionDescriptions.map((description) => {
        switch (description.type) {
          case "feeTransactionPayFromComponent":
            return this.createFeeTransactionPayFromComponent(description);
          case "callMethod":
            return this.createCallMethod(description);
          case "callFunction":
            return this.createCallFunction(description);
          case "addInstruction":
            return this.createAddInstruction(description);
          case "saveVar":
            return this.createSaveVar(description);
        }
      }),
    );
  }

  private createFeeTransactionPayFromComponent(description: FeeTransactionPayFromComponentDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("feeTransactionPayFromComponent"),
        ),
        undefined,
        [factory.createStringLiteral(description.args[0]), factory.createStringLiteral(description.args[1])],
      ),
    );
  }

  private createArgValuesAst(args: ArgValue[]): ts.Expression {
    const expressions = args.map((arg) => {
      if (arg.type === "workspace") {
        return factory.createCallExpression(factory.createIdentifier("fromWorkspace"), undefined, [
          factory.createStringLiteral(arg.value),
        ]);
      }
      return transformObjectToAstArray(arg.value)[0];
    });
    return factory.createArrayLiteralExpression(expressions, false);
  }

  private createCallMethod(description: CallMethodDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("callMethod"),
        ),
        undefined,
        [transformObjectToAstArray(description.method)[0], this.createArgValuesAst(description.args)],
      ),
    );
  }

  private createCallFunction(description: CallFunctionDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("callFunction"),
        ),
        undefined,
        [transformObjectToAstArray(description.function)[0], this.createArgValuesAst(description.args)],
      ),
    );
  }

  private createAddInstruction(description: AddInstructionDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("addInstruction"),
        ),
        undefined,
        transformObjectToAstArray(description.args[0]),
      ),
    );
  }

  private createSaveVar(description: SaveVarDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("saveVar"),
        ),
        undefined,
        [factory.createStringLiteral(description.key)],
      ),
    );
  }
}

function transformObjectToAst(obj: unknown): ts.Expression | ts.Expression[] {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformObjectToAst(item) as ts.Expression);
  }

  if (typeof obj === "object" && obj !== null) {
    const properties = Object.entries(obj).map(([key, value]) =>
      factory.createPropertyAssignment(factory.createIdentifier(key), transformObjectToAst(value) as ts.Expression),
    );
    return factory.createObjectLiteralExpression(properties, true);
  } else if (typeof obj === "string") {
    return factory.createStringLiteral(obj);
  } else if (typeof obj === "number") {
    return factory.createNumericLiteral(obj);
  } else if (typeof obj === "boolean") {
    return obj ? factory.createTrue() : factory.createFalse();
  } else if (obj === null) {
    return factory.createNull();
  } else if (obj === undefined) {
    return factory.createIdentifier("undefined");
  } else {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return factory.createIdentifier(String(obj));
  }
}

function transformObjectToAstArray(obj: unknown): ts.Expression[] {
  const expressions = transformObjectToAst(obj);
  return Array.isArray(expressions) ? expressions : [expressions];
}

function addEmptyComment<T extends ts.Node>(node: T) {
  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.SingleLineCommentTrivia, "", true);
}

function stripEmptyComments(code: string): string {
  return code
    .split("\n")
    .map((line) => (/^\s*\/\/\s*$/.test(line) ? "" : line))
    .join("\n");
}
