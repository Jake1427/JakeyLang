// ==========================================
// JLANG SYNTAX & INTERPRETER ENGINE
// ==========================================

window.JLang = {
    isRunning: false,
    variables: {},
    guiActive: false,
    lastLine: "", // Used for the repeat command

    // 1. THE DICTIONARY (Auto-updates the Help Menu)
    // Add new commands here and the IDE will automatically update!
    commandDictionary: [
        { syntax: "add gui", desc: "Adds a pop-up UI for your code to run in." },
        { syntax: "add 2d game", desc: "Adds a 2D game model to the right panel." },
        { syntax: "say [msg]", desc: "Prints text to the terminal or GUI (e.g., say \"hello\")." },
        { syntax: "ask [msg]", desc: "Prompts the user with a question and prints the answer." },
        { syntax: "create button", desc: "Creates a clickable button in the GUI." },
        { syntax: "create character", desc: "Spawns a character sprite." },
        { syntax: "create title", desc: "Creates large title text." },
        { syntax: "button text [msg]", desc: "Changes the text of the last created button." },
        { syntax: "repeat = [num]", desc: "Repeats the immediately preceding line of code X times." },
        { syntax: "wait = [ms]", desc: "Pauses the code for X milliseconds (e.g., wait = 1000)." },
        { syntax: "make [var]=[val]", desc: "Assigns a variable (e.g., make x = 5)." },
        { syntax: "clear", desc: "Clears the terminal and GUI outputs." },
        { syntax: "alert [msg]", desc: "Triggers a browser popup alert." },
        { syntax: "bg color [color]", desc: "Changes the background color of the active output." },
        { syntax: "text color [color]", desc: "Changes the text color of the active output." },
        { syntax: "game speed [num]", desc: "Changes the speed of the 2D game box (Default is 2)." },
        { syntax: "game color [color]", desc: "Changes the color of the 2D game box." },
        { syntax: "show time", desc: "Prints the current time." },
        { syntax: "play beep", desc: "Plays a system beep sound." },
        { syntax: "stop", desc: "Stops the code execution immediately." }
    ],

    // 2. THE RUNNER (Executes the code line by line)
    async run(codeLines, outputEl, guiBodyEl, gameAPI) {
        this.isRunning = true;
        this.guiActive = false;
        this.variables = {};
        this.lastLine = "";

        // Reset UI
        outputEl.innerHTML = "";
        guiBodyEl.innerHTML = "";
        document.getElementById("user-gui").style.display = "none";
        guiBodyEl.style.display = "block";

        const print = (msg) => {
            if (this.guiActive) guiBodyEl.innerHTML += msg + "<br><br>";
            else outputEl.innerHTML += msg + "<br>";
        };

        const processLine = async (line) => {
            if (!this.isRunning) return; // Break if stop button pressed
            line = line.trim();
            if (!line) return;

            try {
                if (line === "add gui") {
                    this.guiActive = true;
                    document.getElementById("user-gui").style.display = "flex";
                }
                else if (line === "add 2d game") gameAPI.start();
                else if (line === "clear") {
                    outputEl.innerHTML = "";
                    guiBodyEl.innerHTML = "";
                }
                else if (line === "stop") this.isRunning = false;
                else if (line === "show time") print(new Date().toLocaleTimeString());
                else if (line === "play beep") {
                    let ctx = new (window.AudioContext || window.webkitAudioContext)();
                    let osc = ctx.createOscillator();
                    osc.connect(ctx.destination);
                    osc.start(); osc.stop(ctx.currentTime + 0.1);
                }
                else if (line.startsWith("say ")) print(line.slice(4).replace(/"/g, ""));
                else if (line.startsWith("alert ")) alert(line.slice(6).replace(/"/g, ""));
                else if (line.startsWith("ask ")) {
                    let q = line.slice(4).replace(/"/g, "");
                    let ans = prompt(q);
                    print(`<i>${q} <br> > ${ans}</i>`);
                }
                else if (line.startsWith("create ")) {
                    let item = line.slice(7).trim().toLowerCase();
                    if (item === "button") print(`<button id="last-btn">App Button</button>`);
                    else if (item === "character") print(`<span style="font-size:30px">🧍‍♂️</span>`);
                    else if (item === "title") print(`<h2>New Title</h2>`);
                    else print(`[Created: ${item}]`);
                }
                else if (line.startsWith("button text ")) {
                    let text = line.slice(12).replace(/"/g, "");
                    let btn = document.getElementById("last-btn");
                    if (btn) btn.innerText = text;
                }
                else if (line.startsWith("bg color ")) {
                    let color = line.slice(9).trim();
                    if (this.guiActive) guiBodyEl.style.backgroundColor = color;
                    else outputEl.style.backgroundColor = color;
                }
                else if (line.startsWith("text color ")) {
                    let color = line.slice(11).trim();
                    if (this.guiActive) guiBodyEl.style.color = color;
                    else outputEl.style.color = color;
                }
                else if (line.startsWith("make ")) {
                    let parts = line.slice(5).split("=");
                    if (parts.length === 2) this.variables[parts[0].trim()] = eval(parts[1]);
                    else throw new Error();
                }
                else if (line.startsWith("wait = ")) {
                    let ms = parseInt(line.slice(7).trim());
                    if(!isNaN(ms)) await new Promise(resolve => setTimeout(resolve, ms));
                }
                else if (line.startsWith("game speed ")) gameAPI.setSpeed(parseInt(line.slice(11)));
                else if (line.startsWith("game color ")) gameAPI.setColor(line.slice(11).trim());
                else if (line.startsWith("repeat = ")) {
                    // Handled outside to prevent infinite recursion, just catch syntax error if misuse
                }
                else throw new Error("Unknown");

            } catch (e) {
                print("<span style='color: #f14c4c;'>Syntax error</span>");
            }
        };

        for (let i = 0; i < codeLines.length; i++) {
            if (!this.isRunning) break;
            let currentLine = codeLines[i].trim();
            
            if (currentLine.startsWith("repeat = ")) {
                let times = parseInt(currentLine.slice(9).trim());
                if (!isNaN(times) && this.lastLine) {
                    for (let r = 0; r < times; r++) {
                        await processLine(this.lastLine);
                    }
                }
            } else {
                await processLine(currentLine);
                this.lastLine = currentLine; // Save for the next potential repeat
            }
        }
        
        this.isRunning = false;
        print("<br><i style='color:gray'>-- Execution Finished --</i>");
    },
    
    stopExecution() {
        this.isRunning = false;
    }
};
