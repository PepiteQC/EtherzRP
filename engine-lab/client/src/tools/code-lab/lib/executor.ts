import type {
  CodeExecutionResult,
  CodeLanguage,
} from '../types'

interface WorkerResponse {
  success: boolean
  output: string
  error?: string
  duration: number
}

function createId(): string {
  return `execution-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

/**
 * Transpilation TypeScript légère.
 *
 * Elle accepte les annotations simples, interfaces,
 * alias de types et assertions courantes.
 *
 * Le Code Lab reste volontairement autonome et ne
 * dépend pas du compilateur TypeScript complet.
 */
function transpileLooseTypeScript(
  source: string
): string {
  return source
    .replace(
      /interface\s+[A-Za-z_$][\w$]*(?:\s+extends\s+[^{]+)?\s*\{[\s\S]*?\}/g,
      ''
    )
    .replace(
      /type\s+[A-Za-z_$][\w$]*(?:<[^>]+>)?\s*=\s*[\s\S]*?;/g,
      ''
    )
    .replace(
      /\s+as\s+const\b/g,
      ''
    )
    .replace(
      /\s+as\s+[A-Za-z_$][\w$<>,.[\]\s|&?]*/g,
      ''
    )
    .replace(
      /([A-Za-z_$][\w$]*)\s*:\s*[A-Za-z_$][\w$<>,.[\]\s|&?]*(?=\s*[,)=;])/g,
      '$1'
    )
    .replace(
      /\)\s*:\s*[A-Za-z_$][\w$<>,.[\]\s|&?]*(?=\s*=>|\s*\{)/g,
      ')'
    )
}

function createWorkerSource(): string {
  return `
self.onmessage = async function(event) {
  const startedAt = performance.now();
  const logs = [];

  function serialize(value) {
    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "undefined") {
      return "undefined";
    }

    if (typeof value === "function") {
      return "[Function " + (value.name || "anonymous") + "]";
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  const isolatedConsole = {
    log: (...args) => {
      logs.push(args.map(serialize).join(" "));
    },

    info: (...args) => {
      logs.push("[INFO] " + args.map(serialize).join(" "));
    },

    warn: (...args) => {
      logs.push("[WARN] " + args.map(serialize).join(" "));
    },

    error: (...args) => {
      logs.push("[ERROR] " + args.map(serialize).join(" "));
    },

    table: (value) => {
      logs.push(serialize(value));
    },
  };

  try {
    const AsyncFunction =
      Object.getPrototypeOf(async function() {}).constructor;

    const runner = new AsyncFunction(
      "console",
      '"use strict";\\n' + event.data.code
    );

    const returnedValue =
      await runner(isolatedConsole);

    if (typeof returnedValue !== "undefined") {
      logs.push("=> " + serialize(returnedValue));
    }

    self.postMessage({
      success: true,
      output:
        logs.length > 0
          ? logs.join("\\n")
          : "Exécution terminée sans sortie.",
      duration: performance.now() - startedAt,
    });
  } catch (error) {
    self.postMessage({
      success: false,
      output: logs.join("\\n"),
      error:
        error instanceof Error
          ? error.stack || error.message
          : String(error),
      duration: performance.now() - startedAt,
    });
  }
};
`
}

export async function executeCode(
  code: string,
  language: CodeLanguage,
  timeout = 5000
): Promise<CodeExecutionResult> {
  const executableCode =
    language === 'typescript'
      ? transpileLooseTypeScript(code)
      : code

  const workerSource =
    createWorkerSource()

  const workerBlob =
    new Blob(
      [workerSource],
      {
        type: 'text/javascript',
      }
    )

  const workerUrl =
    URL.createObjectURL(workerBlob)

  const worker =
    new Worker(workerUrl)

  const createdAt = Date.now()
  const id = createId()

  try {
    const response =
      await new Promise<WorkerResponse>(
        (resolve, reject) => {
          const timeoutId =
            window.setTimeout(() => {
              worker.terminate()

              reject(
                new Error(
                  `Temps limite dépassé après ${timeout} ms.`
                )
              )
            }, timeout)

          worker.onmessage = (
            event: MessageEvent<WorkerResponse>
          ) => {
            window.clearTimeout(timeoutId)
            resolve(event.data)
          }

          worker.onerror = (event) => {
            window.clearTimeout(timeoutId)

            reject(
              new Error(
                event.message ||
                  'Erreur du Worker Code Lab.'
              )
            )
          }

          worker.postMessage({
            code: executableCode,
          })
        }
      )

    return {
      id,
      code,
      language,
      success: response.success,
      output:
        response.output ||
        response.error ||
        'Exécution terminée.',
      error: response.error,
      duration:
        Math.max(
          0,
          Math.round(response.duration)
        ),
      createdAt,
    }
  } catch (error) {
    return {
      id,
      code,
      language,
      success: false,
      output:
        error instanceof Error
          ? error.message
          : 'Erreur inconnue.',
      error:
        error instanceof Error
          ? error.message
          : 'Erreur inconnue.',
      duration: timeout,
      createdAt,
    }
  } finally {
    worker.terminate()
    URL.revokeObjectURL(workerUrl)
  }
}
