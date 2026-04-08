// =======================
// JLANG INTERPRETER (JS)
// =======================
function runCode() {
    const code = document.getElementById("code").value.split("\n");
    const output = document.getElementById("output");

    output.innerHTML = "";

    let variables = {};

    for (let line of code) {
        line = line.trim();

        if (!line) continue;

        try {
            // SAY
            if (line.startsWith("say ")) {
                let content = line.substring(4);

                if (variables[content] !== undefined) {
                    print(variables[content]);
                } else if (!isNaN(eval(content))) {
                    print(eval(content));
                } else {
                    print(content);
                }
            }

            // MAKE
            else if (line.startsWith("make ")) {
                let expr = line.substring(5);
                let [name, value] = expr.split("=");

                name = name.trim();
                value = value.trim();

                variables[name] = eval(value);
            }

            // ASK (basic browser input)
            else if (line.startsWith("ask ")) {
                let parts = line.substring(4).split("->");

                let question = parts[0].trim();
                let varName = parts[1].trim();

                let answer = prompt(question);
                variables[varName] = answer;
            }

            // ADD GUI (browser alert demo)
            else if (line === "add gui") {
                print("[GUI mode enabled (browser simulation)]");
            }

            else {
                print("Unknown: " + line);
            }

        } catch (err) {
            print("Error: " + err.message);
        }
    }

    function print(msg) {
        output.innerHTML += msg + "<br>";
    }
}

//
// ❄️ SNOW EFFECT
//
const canvas = document.getElementById("snow");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let snowflakes = [];

for (let i = 0; i < 100; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3,
        d: Math.random() * 1
    });
}

function drawSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.beginPath();

    for (let f of snowflakes) {
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
    }

    ctx.fill();
    moveSnow();
}

function moveSnow() {
    for (let f of snowflakes) {
        f.y += f.d;
        f.x += Math.sin(f.y * 0.01);

        if (f.y > canvas.height) {
            f.y = 0;
            f.x = Math.random() * canvas.width;
        }
    }
}

setInterval(drawSnow, 33);
