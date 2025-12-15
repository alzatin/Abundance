//script to generate methodsreplicad.json from replicad.d.ts
// run this script again to update methodsreplicad.json
// if you regenerate make sure you move the file to src/components/secondary/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dtsPath = path.join(
  __dirname,
  "node_modules/replicad/dist/replicad.d.ts"
);
const outputPath = path.join(__dirname, "methodsreplicad.json");

const dts = fs.readFileSync(dtsPath, "utf8");
const sourceFile = ts.createSourceFile(
  dtsPath,
  dts,
  ts.ScriptTarget.Latest,
  true
);

const apiJson = {};

function getParamInfo(param) {
  if (ts.isParameter(param)) {
    const name = param.name.getText();
    const isOptional = !!param.questionToken || !!param.initializer;
    return { name, optional: isOptional };
  }
  return null;
}

function getParams(node) {
  if (!node.parameters) return [];
  return node.parameters.map(getParamInfo).filter(Boolean);
}

function getReturnType(node) {
  if (node.type) return node.type.getText();
  return "unknown";
}

function processFunction(node) {
  const name = node.name.getText();
  const params = getParams(node);
  apiJson[name] = {
    type: "function",
    requiredParams: params.filter((p) => !p.optional).map((p) => p.name),
    optionalParams: params.filter((p) => p.optional).map((p) => p.name),
    returns: getReturnType(node),
  };
}

function processClass(node) {
  const className = node.name.getText();
  node.members.forEach((member) => {
    if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
      const methodName = member.name.getText();
      if (methodName === "constructor") return;
      const params = getParams(member);
      apiJson[`${className}.${methodName}`] = {
        type: "method",
        requiredParams: params.filter((p) => !p.optional).map((p) => p.name),
        optionalParams: params.filter((p) => p.optional).map((p) => p.name),
        returns: getReturnType(member),
      };
    }
  });
}

sourceFile.forEachChild((node) => {
  if (ts.isFunctionDeclaration(node) && node.name) {
    processFunction(node);
  }
  if (ts.isClassDeclaration(node) && node.name) {
    processClass(node);
  }
});

fs.writeFileSync(outputPath, JSON.stringify(apiJson, null, 2));
console.log(`Replicad API JSON generated at ${outputPath}`);
