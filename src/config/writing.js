import modInline from 'mod-inline';
import path from 'path';

export default async function writing(yo) {
  if (yo.context.configItem.secret) {
    yo.fs.copy(
      path.resolve(yo.context.destination, 'templates/secret.yaml'),
      yo.destinationPath('templates/secret.yaml'),
      { process: content => processSecret(content, yo.context) }
    );
  } else {
    yo.fs.copy(
      path.resolve(yo.context.destination, 'templates/configmap.yaml'),
      yo.destinationPath('templates/configmap.yaml'),
      { process: content => processConfigMap(content, yo.context) }
    );
  }
  yo.fs.copy(
    path.resolve(yo.context.destination, 'values.yaml'),
    yo.destinationPath('values.yaml'),
    { process: content => processValues(content, yo.context) }
  );
  yo.fs.copy(
    path.resolve(yo.context.destination, 'questions.yaml'),
    yo.destinationPath('questions.yaml'),
    { process: content => processQuestions(content, yo.context) }
  );
}

function processConfigMap(content, context) {
  const { configItem } = context;
  const DATA = /\ndata:(\n {2}[^\n]+)+/;
  content = content.toString();
  content = modInline.append(
    content,
    DATA,
    `
  ${configItem.key}: {{ .Values.config.${configItem.key} | quote }}`
  );
  return content;
}

function processSecret(content, context) {
  const { configItem } = context;
  const DATA = /\ndata:(\n {2}[^\n]+)+/;
  content = content.toString();
  content = modInline.append(
    content,
    DATA,
    `
  ${configItem.key}: {{ .Values.config.${configItem.key} | b64enc }}`
  );
  return content;
}

function processValues(content, context) {
  const { configItem } = context;
  const CONFIG = /\nconfig:(\n {2}[^\n]+)+/;
  content = content.toString();
  content = modInline.append(
    content,
    CONFIG,
    `
  ${configItem.key}: '${configItem.defaultValue}'`
  );
  return content;
}

function processQuestions(content, context) {
  const { configItem } = context;
  const IMPRECISE_CONFIG = /\nquestions:\n(.|\n)* {4}group: Config([^-#]|\n)*/;
  const PRECISE_CONFIG = /(\n {2}- [^\n]+(\n {4}[^\n]+)+)+/;
  content = content.toString();
  content = modInline.append(
    content,
    [IMPRECISE_CONFIG, PRECISE_CONFIG],
    `
  - variable: config.${configItem.key}
    default: '${configItem.defaultValue}'
    description: '${configItem.description}'
    type: ${configItem.type}
    required: ${configItem.required}
    label: '${configItem.description}'
    group: Config`
  );
  return content;
}
