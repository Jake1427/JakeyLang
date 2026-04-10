// ==========================================
// JLANG SYNTAX & INTERPRETER ENGINE (V2 EXTENDED)
// ==========================================

window.JLang = {
    isRunning: false,
    variables: {},
    guiActive: false,
    lastLine: "",
    lastElement: null,

    commandDictionary: [
        { syntax: "add gui", desc: "Enable GUI mode" },
        { syntax: "add 2d game", desc: "Start 2D game engine" },
        { syntax: "say \"text\"", desc: "Print text" },
        { syntax: "ask \"text\"", desc: "User input prompt" },
        { syntax: "alert \"text\"", desc: "Browser alert" },
        { syntax: "create button", desc: "Create button" },
        { syntax: "create title", desc: "Create title text" },
        { syntax: "create character", desc: "Spawn emoji character" },
        { syntax: "button text \"x\"", desc: "Change button text" },
        { syntax: "bg color red", desc: "Background color" },
        { syntax: "text color red", desc: "Text color" },
        { syntax: "wait = 1000", desc: "Delay execution" },
        { syntax: "make x = 5", desc: "Variables" },
        { syntax: "repeat = 3", desc: "Repeat last line" },
        { syntax: "stop", desc: "Stop program" },
        
        { syntax: "fade in", desc: "Fade UI in" },
        { syntax: "fade out", desc: "Fade UI out" },
        { syntax: "shake", desc: "Shake screen" },
        { syntax: "flash", desc: "Screen flash" },
        { syntax: "move left", desc: "Move UI left" },
        { syntax: "move right", desc: "Move UI right" },
        { syntax: "move up", desc: "Move UI up" },
        { syntax: "move down", desc: "Move UI down" },

        { syntax: "border glow", desc: "Glow border effect" },
        { syntax: "reset style", desc: "Reset UI style" },
        { syntax: "font big", desc: "Increase font size" },
        { syntax: "font small", desc: "Decrease font size" },

        { syntax: "play beep", desc: "Sound" },
        { syntax: "play click", desc: "Click sound" },
        { syntax: "show time", desc: "Show time" },
        { syntax: "show date", desc: "Show date" },

        { syntax: "random number", desc: "Generate number" },
        { syntax: "math add", desc: "Add variables" },
        { syntax: "math sub", desc: "Subtract" },
        { syntax: "math mul", desc: "Multiply" },
        { syntax: "math div", desc: "Divide" },

        { syntax: "set title", desc: "Page title" },
        { syntax: "set favicon", desc: "Page icon" },

        { syntax: "log", desc: "Console log" },
        { syntax: "warn", desc: "Warning log" },

        { syntax: "timer start", desc: "Start timer" },
        { syntax: "timer stop", desc: "Stop timer" },

        { syntax: "create box", desc: "UI box" },
        { syntax: "create label", desc: "UI label" },

        { syntax: "hide gui", desc: "Hide UI" },
        { syntax: "show gui", desc: "Show UI" },

        { syntax: "loop forever", desc: "Infinite loop (safe)" }
    ],

    async run(codeLines, outputEl, guiBodyEl, gameAPI) {

        this.isRunning = true;
        this.variables = {};
        this.guiActive = false;
        this.lastLine = "";

        outputEl.innerHTML = "";
        guiBodyEl.innerHTML = "";

        const print = (msg) => {
            if (this.guiActive) guiBodyEl.innerHTML += msg + "<br>";
            else outputEl.innerHTML += msg + "<br>";
        };

        const delay = (ms) => new Promise(r => setTimeout(r, ms));

        const animate = (el, type) => {
            if (!el) return;
            el.style.transition = "all 0.3s ease";

            if (type === "shake") {
                el.style.transform = "translateX(10px)";
                setTimeout(() => el.style.transform = "translateX(-10px)", 100);
                setTimeout(() => el.style.transform = "translateX(0px)", 200);
            }

            if (type === "fade") {
                el.style.opacity = "0";
                setTimeout(() => el.style.opacity = "1", 200);
            }
        };

        const process = async (line) => {
            if (!this.isRunning) return;
            line = line.trim();
            if (!line) return;

            try {

                // ===== CORE =====
                if (line === "add gui") {
                    this.guiActive = true;
                    document.getElementById("user-gui").style.display = "flex";
                }

                else if (line === "clear") {
                    outputEl.innerHTML = "";
                    guiBodyEl.innerHTML = "";
                }

                else if (line === "stop") this.isRunning = false;

                else if (line === "show time") print(new Date().toLocaleTimeString());

                else if (line === "show date") print(new Date().toLocaleDateString());

                // ===== TEXT =====
                else if (line.startsWith("say ")) print(line.slice(4).replace(/"/g, ""));
                else if (line.startsWith("alert ")) alert(line.slice(6).replace(/"/g, ""));
                else if (line.startsWith("log ")) console.log(line.slice(4));
                else if (line.startsWith("warn ")) console.warn(line.slice(5));

                else if (line.startsWith("ask ")) {
                    let ans = prompt(line.slice(4).replace(/"/g, ""));
                    print(ans);
                }

                // ===== UI =====
                else if (line === "create button") {
                    this.lastElement = document.createElement("button");
                    this.lastElement.innerText = "Button";
                    guiBodyEl.appendChild(this.lastElement);
                }

                else if (line.startsWith("button msg =")) {
                    if (this.lastElement) {
                        this.lastElement.innerText = line.split("=")[1].replace(/"/g, "").trim();
                    }
                }

                else if (line === "create title") {
                    let h = document.createElement("h2");
                    h.innerText = "Title";
                    guiBodyEl.appendChild(h);
                }

                else if (line === "create label") {
                    let l = document.createElement("div");
                    l.innerText = "Label";
                    guiBodyEl.appendChild(l);
                }

                else if (line === "create box") {
                    let d = document.createElement("div");
                    d.style.width = "100px";
                    d.style.height = "100px";
                    d.style.background = "gray";
                    guiBodyEl.appendChild(d);
                }

                // ===== STYLING =====
                else if (line.startsWith("bg color ")) {
                    guiBodyEl.style.background = line.slice(9);
                }

                else if (line.startsWith("text color ")) {
                    guiBodyEl.style.color = line.slice(11);
                }

                else if (line === "fade in") animate(guiBodyEl, "fade");
                else if (line === "shake") animate(guiBodyEl, "shake");

                else if (line === "font big") guiBodyEl.style.fontSize = "30px";
                else if (line === "font small") guiBodyEl.style.fontSize = "12px";

                // ===== VARIABLES =====
                else if (line.startsWith("make ")) {
                    let [k, v] = line.slice(5).split("=");
                    this.variables[k.trim()] = v.trim();
                }

                // ===== MATH =====
                else if (line === "random number") {
                    print(Math.floor(Math.random() * 100));
                }

                // ===== TIME =====
                else if (line.startsWith("wait = ")) {
                    await delay(parseInt(line.split("=")[1]));
                }

                // ===== GAME =====
                else if (line === "add 2d game") gameAPI.start();
                else if (line.startsWith("game speed ")) gameAPI.setSpeed(parseInt(line.slice(11)));
                else if (line.startsWith("game color ")) gameAPI.setColor(line.slice(11));

                // ===== LOOP =====
                else if (line.startsWith("repeat = ")) {
                    let t = parseInt(line.split("=")[1]);
                    for (let i = 0; i < t; i++) {
                        await this.process(this.lastLine, outputEl, guiBodyEl, gameAPI);
                    }
                }

                else this.lastLine = line;

            } catch (e) {
                print("Syntax Error");
            }
        };

        for (let i = 0; i < codeLines.length; i++) {
            if (!this.isRunning) break;
            await process(codeLines[i]);
        }

        print("-- Finished --");
        this.isRunning = false;
    }
};
