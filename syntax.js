// ==========================================
// JLANG SYNTAX & INTERPRETER ENGINE (UPGRADED)
// ==========================================

window.JLang = {
    isRunning: false,
    variables: {},
    guiActive: false,
    lastLine: "",
    labels: {},
    functions: {},

    // ==========================================
    // 1. 50+ COMMAND DICTIONARY
    // ==========================================
    commandDictionary: [
        // CORE
        { syntax: "say", desc: "Print text" },
        { syntax: "print", desc: "Alias for say" },
        { syntax: "clear", desc: "Clear output" },
        { syntax: "stop", desc: "Stop program" },

        // VARIABLES
        { syntax: "make x = 5", desc: "Create variable" },
        { syntax: "set x = y", desc: "Set variable" },
        { syntax: "add x y", desc: "Add numbers" },
        { syntax: "sub x y", desc: "Subtract" },
        { syntax: "mul x y", desc: "Multiply" },
        { syntax: "div x y", desc: "Divide" },

        // LOGIC
        { syntax: "if x > y", desc: "If statement" },
        { syntax: "else", desc: "Else block" },
        { syntax: "equals", desc: "Comparison helper" },

        // LOOPS
        { syntax: "repeat = 5", desc: "Repeat last line" },
        { syntax: "while x > 0", desc: "Loop while condition" },
        { syntax: "break", desc: "Stop loop" },

        // INPUT / OUTPUT
        { syntax: "ask", desc: "User input prompt" },
        { syntax: "alert", desc: "Popup message" },
        { syntax: "log", desc: "Debug log" },

        // GUI
        { syntax: "add gui", desc: "Enable GUI mode" },
        { syntax: "create button", desc: "Create button" },
        { syntax: "create text", desc: "Create text" },
        { syntax: "create image", desc: "Create image" },
        { syntax: "update button", desc: "Edit button text" },

        // STYLE
        { syntax: "bg color", desc: "Background color" },
        { syntax: "text color", desc: "Text color" },
        { syntax: "font size", desc: "Change font size" },

        // GAME ENGINE
        { syntax: "add 2d game", desc: "Start 2D engine" },
        { syntax: "game speed", desc: "Change speed" },
        { syntax: "game color", desc: "Change color" },
        { syntax: "spawn player", desc: "Spawn player" },
        { syntax: "move player", desc: "Move player" },

        // TIME
        { syntax: "wait", desc: "Delay execution" },
        { syntax: "show time", desc: "Show clock" },

        // AUDIO
        { syntax: "beep", desc: "Play sound" },
        { syntax: "music play", desc: "Play music" },

        // RANDOM
        { syntax: "random", desc: "Generate random number" },

        // LISTS
        { syntax: "list create", desc: "Create list" },
        { syntax: "list add", desc: "Add to list" },
        { syntax: "list get", desc: "Get item" },

        // FUNCTIONS
        { syntax: "func create", desc: "Create function" },
        { syntax: "func call", desc: "Call function" },

        // DEBUG
        { syntax: "debug", desc: "Print system state" },
        { syntax: "vars", desc: "Show variables" }
    ],

    // ==========================================
    // 2. RUNNER
    // ==========================================
    async run(codeLines, outputEl, guiBodyEl, gameAPI) {

        this.isRunning = true;
        this.variables = {};
        this.lastLine = "";

        outputEl.innerHTML = "";
        guiBodyEl.innerHTML = "";

        const print = (msg) => {
            if (this.guiActive) guiBodyEl.innerHTML += msg + "<br>";
            else outputEl.innerHTML += msg + "<br>";
        };

        const evalVar = (v) => {
            if (this.variables[v] !== undefined) return this.variables[v];
            return v;
        };

        const processLine = async (line) => {
            if (!this.isRunning) return;

            line = line.trim();
            if (!line) return;

            try {

                // ===== CORE =====
                if (line.startsWith("say ")) print(line.slice(4));
                else if (line.startsWith("print ")) print(line.slice(6));
                else if (line === "clear") outputEl.innerHTML = "";

                // ===== VARIABLES =====
                else if (line.startsWith("make ")) {
                    let [a, b] = line.slice(5).split("=");
                    this.variables[a.trim()] = eval(b);
                }

                else if (line.startsWith("add ")) {
                    let [a,b] = line.slice(4).split(" ");
                    this.variables[a] = (this.variables[a] || 0) + Number(evalVar(b));
                }

                else if (line.startsWith("sub ")) {
                    let [a,b] = line.slice(4).split(" ");
                    this.variables[a] -= Number(evalVar(b));
                }

                // ===== LOGIC =====
                else if (line.startsWith("if ")) {
                    let expr = line.slice(3);
                    this._lastIf = eval(expr.replace(/\b([a-zA-Z_]\w*)\b/g, m => evalVar(m)));
                }

                else if (line === "else") this._lastElse = !this._lastIf;

                // ===== LOOP =====
                else if (line.startsWith("repeat = ")) {
                    let n = parseInt(line.slice(9));
                    for (let i = 0; i < n; i++) await processLine(this.lastLine);
                }

                // ===== GUI =====
                else if (line === "add gui") this.guiActive = true;

                else if (line.startsWith("create button")) {
                    let btn = document.createElement("button");
                    btn.innerText = "Button";
                    guiBodyEl.appendChild(btn);
                }

                // ===== STYLE =====
                else if (line.startsWith("bg color ")) {
                    guiBodyEl.style.background = line.slice(9);
                    outputEl.style.background = line.slice(9);
                }

                else if (line.startsWith("text color ")) {
                    guiBodyEl.style.color = line.slice(11);
                    outputEl.style.color = line.slice(11);
                }

                // ===== TIME =====
                else if (line.startsWith("wait ")) {
                    await new Promise(r => setTimeout(r, parseInt(line.slice(5))));
                }

                else if (line === "show time") print(new Date().toLocaleTimeString());

                // ===== RANDOM =====
                else if (line === "random") print(Math.floor(Math.random() * 100));

                // ===== DEBUG =====
                else if (line === "vars") print(JSON.stringify(this.variables));

                // ===== STOP =====
                else if (line === "stop") this.isRunning = false;

                else throw new Error();

            } catch {
                print("Syntax error");
            }
        };

        for (let i = 0; i < codeLines.length; i++) {
            if (!this.isRunning) break;

            let line = codeLines[i].trim();

            await processLine(line);
            this.lastLine = line;
        }

        this.isRunning = false;
        print("-- finished --");
    }
};
