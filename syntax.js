// ==========================================
// JLANG SYNTAX & INTERPRETER ENGINE (V3 – Modular & Scalable)
// ==========================================

window.JLang = (function() {
  // ---------- Lexer ----------
  class Lexer {
    static tokenize(line) {
      const tokens = [];
      let i = 0;
      const len = line.length;
      while (i < len) {
        const ch = line[i];
        if (ch === '"' || ch === "'") {
          const quote = ch;
          let str = '';
          i++;
          while (i < len && line[i] !== quote) {
            if (line[i] === '\\' && i + 1 < len) {
              str += line[i + 1];
              i += 2;
            } else {
              str += line[i];
              i++;
            }
          }
          if (i < len) i++; // skip closing quote
          tokens.push({ type: 'string', value: str });
        } else if (/[a-zA-Z_]/.test(ch)) {
          let word = '';
          while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
            word += line[i];
            i++;
          }
          tokens.push({ type: 'word', value: word });
        } else if (/[0-9.]/.test(ch)) {
          let num = '';
          while (i < len && /[0-9.]/.test(line[i])) {
            num += line[i];
            i++;
          }
          tokens.push({ type: 'number', value: parseFloat(num) });
        } else if (ch === '=' && line[i+1] === '>') {
          tokens.push({ type: 'arrow', value: '=>' });
          i += 2;
        } else if ('=<>!+-*/%'.includes(ch)) {
          let op = ch;
          i++;
          if (i < len && '=<>'.includes(line[i])) op += line[i++];
          tokens.push({ type: 'operator', value: op });
        } else if (ch === ':' || ch === ',' || ch === '(' || ch === ')') {
          tokens.push({ type: 'punctuation', value: ch });
          i++;
        } else {
          i++; // skip whitespace / unknown
        }
      }
      return tokens;
    }
  }

  // ---------- Parser (AST Builder) ----------
  class Parser {
    constructor(lines) {
      this.lines = lines;
      this.index = 0;
      this.indentStack = [0];
    }

    parse() {
      const ast = { type: 'Program', body: [] };
      while (this.index < this.lines.length) {
        const stmt = this.parseStatement();
        if (stmt) ast.body.push(stmt);
      }
      return ast;
    }

    parseStatement() {
      const line = this.lines[this.index];
      if (!line || line.trim() === '') {
        this.index++;
        return null;
      }

      const indent = line.search(/\S|$/);
      const currentIndent = this.indentStack[this.indentStack.length - 1];
      if (indent < currentIndent) {
        // dedent – finish block
        this.indentStack.pop();
        return null;
      }
      if (indent > currentIndent) {
        // indented – belongs to parent block
        return null;
      }

      const trimmed = line.trim();
      this.index++;

      // Handle block starters (colon at end)
      if (trimmed.endsWith(':')) {
        const commandLine = trimmed.slice(0, -1).trim();
        const tokens = Lexer.tokenize(commandLine);
        const node = this.parseCommand(tokens);
        node.block = [];
        this.indentStack.push(indent + 2); // expect next indent
        // collect block statements
        while (this.index < this.lines.length) {
          const blockStmt = this.parseStatement();
          if (blockStmt) node.block.push(blockStmt);
          else break;
        }
        return node;
      } else {
        const tokens = Lexer.tokenize(trimmed);
        return this.parseCommand(tokens);
      }
    }

    parseCommand(tokens) {
      if (tokens.length === 0) return null;
      const first = tokens[0];
      if (first.type === 'word') {
        const cmd = first.value;
        const args = tokens.slice(1);
        // Special handling for assignments
        if (cmd === 'make' && args.length >= 3 && args[1].value === '=') {
          return {
            type: 'Assignment',
            name: args[0].value,
            value: this.parseExpression(args.slice(2))
          };
        }
        if (cmd === 'set' && args.length >= 3 && args[1].value === '=') {
          return {
            type: 'Assignment',
            name: args[0].value,
            value: this.parseExpression(args.slice(2))
          };
        }
        if (cmd === 'if') {
          return this.parseIf(tokens);
        }
        if (cmd === 'repeat') {
          return this.parseRepeat(tokens);
        }
        if (cmd === 'func') {
          return this.parseFuncDef(tokens);
        }
        if (cmd === 'on') {
          return this.parseEvent(tokens);
        }
        return {
          type: 'Command',
          name: cmd,
          args: args.map(t => t.value)
        };
      }
      return null;
    }

    parseExpression(tokens) {
      // Simplified: just return tokens as raw for evaluation later
      return { type: 'Expression', tokens };
    }

    parseIf(tokens) {
      // if x == 5 then say "yes"
      const condTokens = tokens.slice(1, tokens.findIndex(t => t.value === 'then'));
      const thenIndex = tokens.findIndex(t => t.value === 'then');
      const elseIndex = tokens.findIndex(t => t.value === 'else');
      let thenTokens = [];
      let elseTokens = null;
      if (thenIndex >= 0) {
        thenTokens = tokens.slice(thenIndex + 1, elseIndex >= 0 ? elseIndex : undefined);
      }
      if (elseIndex >= 0) {
        elseTokens = tokens.slice(elseIndex + 1);
      }
      return {
        type: 'If',
        condition: this.parseExpression(condTokens),
        then: thenTokens.length ? this.parseCommand(thenTokens) : null,
        else: elseTokens ? this.parseCommand(elseTokens) : null
      };
    }

    parseRepeat(tokens) {
      // repeat 5 times:
      const count = parseInt(tokens[1].value);
      return { type: 'Repeat', count };
    }

    parseFuncDef(tokens) {
      const name = tokens[1].value;
      return { type: 'FuncDef', name };
    }

    parseEvent(tokens) {
      // on click button1 => say "hello"
      const arrowIdx = tokens.findIndex(t => t.value === '=>');
      const eventDesc = tokens.slice(1, arrowIdx);
      const actionTokens = tokens.slice(arrowIdx + 1);
      return {
        type: 'EventRegistration',
        event: eventDesc.map(t => t.value).join(' '),
        action: this.parseCommand(actionTokens)
      };
    }
  }

  // ---------- Execution Context ----------
  class ExecutionContext {
    constructor(outputEl, guiBodyEl, gameAPI) {
      this.outputEl = outputEl;
      this.guiBodyEl = guiBodyEl;
      this.gameAPI = gameAPI;
      this.variables = new Map();
      this.uiElements = new Map();
      this.functions = new Map();
      this.eventHandlers = new Map();
      this.animations = [];
      this.isRunning = true;
      this.lineNumber = 0;
      this.guiActive = false;
      this.commands = new Map();
      this.registerBuiltins();
    }

    registerCommand(name, handler, description) {
      this.commands.set(name, { handler, description });
    }

    registerBuiltins() {
      // Basic output
      this.registerCommand('say', (ctx, args) => {
        const msg = this.evaluateArg(args[0], ctx);
        this.print(msg);
      }, 'say "text"');
      this.registerCommand('ask', async (ctx, args) => {
        const question = this.evaluateArg(args[0], ctx);
        const ans = prompt(question);
        this.print(ans || '');
      }, 'ask "question"');
      this.registerCommand('alert', (ctx, args) => {
        alert(this.evaluateArg(args[0], ctx));
      }, 'alert "text"');
      this.registerCommand('clear', (ctx) => {
        ctx.outputEl.innerHTML = '';
        ctx.guiBodyEl.innerHTML = '';
      }, 'clear');
      this.registerCommand('stop', (ctx) => {
        ctx.isRunning = false;
      }, 'stop');
      this.registerCommand('wait', async (ctx, args) => {
        const ms = Number(this.evaluateArg(args[0], ctx));
        await this.delay(ms);
      }, 'wait 1000');

      // GUI
      this.registerCommand('add gui', (ctx) => {
        ctx.guiActive = true;
        document.getElementById('user-gui').style.display = 'flex';
      }, 'add gui');
      this.registerCommand('create', (ctx, args) => {
        const type = args[0];
        const label = args.length > 1 ? this.evaluateArg(args[1], ctx) : '';
        const id = `elem_${Date.now()}_${Math.random()}`;
        let el;
        if (type === 'button') {
          el = document.createElement('button');
          el.textContent = label || 'Button';
          el.addEventListener('click', () => this.triggerEvent('click', el));
        } else if (type === 'label' || type === 'title') {
          el = document.createElement(type === 'title' ? 'h2' : 'div');
          el.textContent = label || (type === 'title' ? 'Title' : 'Label');
        } else if (type === 'input') {
          el = document.createElement('input');
          el.placeholder = label || '';
        } else {
          throw new Error(`Unknown element type: ${type}`);
        }
        el.id = id;
        ctx.guiBodyEl.appendChild(el);
        ctx.uiElements.set(id, el);
        return id;
      }, 'create button "Click me"');

      // Variables & Math
      this.registerCommand('make', (ctx, args) => {
        // handled by Assignment node, but also as command
        const name = args[0];
        const value = this.evaluateArg(args[2], ctx);
        ctx.variables.set(name, value);
      }, 'make x = 5');
      this.registerCommand('add', (ctx, args) => {
        const varName = args[0];
        const val = Number(this.evaluateArg(args[1], ctx));
        const current = Number(ctx.variables.get(varName) || 0);
        ctx.variables.set(varName, current + val);
      }, 'add x 10');
      this.registerCommand('sub', (ctx, args) => {
        const varName = args[0];
        const val = Number(this.evaluateArg(args[1], ctx));
        const current = Number(ctx.variables.get(varName) || 0);
        ctx.variables.set(varName, current - val);
      }, 'sub x 5');
      this.registerCommand('mul', (ctx, args) => {
        const varName = args[0];
        const val = Number(this.evaluateArg(args[1], ctx));
        const current = Number(ctx.variables.get(varName) || 0);
        ctx.variables.set(varName, current * val);
      }, 'mul x 2');
      this.registerCommand('div', (ctx, args) => {
        const varName = args[0];
        const val = Number(this.evaluateArg(args[1], ctx));
        const current = Number(ctx.variables.get(varName) || 0);
        ctx.variables.set(varName, current / val);
      }, 'div x 2');
      this.registerCommand('set', (ctx, args) => {
        const name = args[0];
        const value = this.evaluateArg(args[2], ctx);
        ctx.variables.set(name, value);
      }, 'set x = y');
      this.registerCommand('print', (ctx, args) => {
        this.print(this.evaluateArg(args[0], ctx));
      }, 'print x');

      // UI Styling
      this.registerCommand('set text color', (ctx, args) => {
        ctx.guiBodyEl.style.color = args[0];
      }, 'set text color "red"');
      this.registerCommand('set bg color', (ctx, args) => {
        ctx.guiBodyEl.style.backgroundColor = args[0];
      }, 'set bg color "#000"');
      this.registerCommand('set font size', (ctx, args) => {
        ctx.guiBodyEl.style.fontSize = args[0] + 'px';
      }, 'set font size 20');
      this.registerCommand('set opacity', (ctx, args) => {
        ctx.guiBodyEl.style.opacity = args[0];
      }, 'set opacity 0.5');
      this.registerCommand('update text', (ctx, args) => {
        const id = args[0];
        const text = this.evaluateArg(args[1], ctx);
        const el = ctx.uiElements.get(id);
        if (el) el.textContent = text;
      }, 'update text element');
      this.registerCommand('delete', (ctx, args) => {
        const id = args[0];
        const el = ctx.uiElements.get(id);
        if (el) {
          el.remove();
          ctx.uiElements.delete(id);
        }
      }, 'delete element');

      // Events
      this.registerCommand('on', (ctx, args) => {
        // handled by EventRegistration node
      }, 'on click button1 => say "hello"');

      // Functions
      this.registerCommand('func', (ctx, args) => {}, 'func greet()');
      this.registerCommand('call', async (ctx, args) => {
        const name = args[0];
        const func = ctx.functions.get(name);
        if (func) {
          await this.evaluateBlock(func.block, ctx);
        }
      }, 'call greet');

      // Game
      this.registerCommand('spawn player', (ctx) => {
        ctx.gameAPI.start();
      }, 'spawn player');
      this.registerCommand('move player', (ctx, args) => {
        const x = Number(this.evaluateArg(args[0], ctx));
        const y = Number(this.evaluateArg(args[1], ctx));
        ctx.gameAPI.movePlayer(x, y);
      }, 'move player x y');
      this.registerCommand('set speed', (ctx, args) => {
        ctx.gameAPI.setSpeed(Number(this.evaluateArg(args[0], ctx)));
      }, 'set speed 5');
      this.registerCommand('set color', (ctx, args) => {
        ctx.gameAPI.setColor(args[0]);
      }, 'set color blue');
      this.registerCommand('spawn enemy', (ctx) => {
        ctx.gameAPI.spawnEnemy();
      }, 'spawn enemy');
      this.registerCommand('detect collision', (ctx) => {
        const collided = ctx.gameAPI.detectCollision();
        this.print(collided ? 'Collision detected!' : 'No collision');
      }, 'detect collision');

      // Control Flow
      this.registerCommand('if', () => {}, 'if x == 5 then say "yes"');
      this.registerCommand('else', () => {}, 'else');
      this.registerCommand('repeat', () => {}, 'repeat 5 times:');
      this.registerCommand('loop while', (ctx, args) => {
        // handled specially
      }, 'loop while true:');
      this.registerCommand('break', (ctx) => {
        ctx.breakLoop = true;
      }, 'break');
      this.registerCommand('return', (ctx) => {
        ctx.returnValue = this.evaluateArg(args[0], ctx);
        ctx.shouldReturn = true;
      }, 'return');

      // Animation
      this.registerCommand('animate', (ctx, args) => {
        const animType = args[0];
        const targetId = args[1];
        const duration = Number(args[2]) || 500;
        const el = ctx.uiElements.get(targetId) || ctx.guiBodyEl;
        this.animate(el, animType, duration, args.slice(3));
      }, 'animate fade element 500');
      this.registerCommand('shake screen', (ctx) => {
        document.body.style.transform = 'translateX(10px)';
        setTimeout(() => document.body.style.transform = 'translateX(-10px)', 100);
        setTimeout(() => document.body.style.transform = '', 200);
      }, 'shake screen');
      this.registerCommand('pulse', (ctx, args) => {
        const el = ctx.uiElements.get(args[0]) || ctx.guiBodyEl;
        this.animate(el, 'pulse', 300);
      }, 'pulse button');

      // Additional commands (50+ total)
      this.registerCommand('show time', (ctx) => {
        this.print(new Date().toLocaleTimeString());
      }, 'show time');
      this.registerCommand('show date', (ctx) => {
        this.print(new Date().toLocaleDateString());
      }, 'show date');
      this.registerCommand('log', (ctx, args) => {
        console.log(this.evaluateArg(args[0], ctx));
      }, 'log "message"');
      this.registerCommand('warn', (ctx, args) => {
        console.warn(this.evaluateArg(args[0], ctx));
      }, 'warn "message"');
      this.registerCommand('random number', (ctx) => {
        this.print(Math.floor(Math.random() * 100));
      }, 'random number');
      this.registerCommand('timer start', (ctx) => {
        ctx.timerStart = Date.now();
      }, 'timer start');
      this.registerCommand('timer stop', (ctx) => {
        if (ctx.timerStart) {
          const elapsed = Date.now() - ctx.timerStart;
          this.print(`Elapsed: ${elapsed}ms`);
        }
      }, 'timer stop');
      this.registerCommand('set title', (ctx, args) => {
        document.title = this.evaluateArg(args[0], ctx);
      }, 'set title "My App"');
      this.registerCommand('hide gui', (ctx) => {
        document.getElementById('user-gui').style.display = 'none';
      }, 'hide gui');
      this.registerCommand('show gui', (ctx) => {
        document.getElementById('user-gui').style.display = 'flex';
      }, 'show gui');
      this.registerCommand('reset style', (ctx) => {
        ctx.guiBodyEl.style.cssText = '';
      }, 'reset style');
      this.registerCommand('border glow', (ctx) => {
        ctx.guiBodyEl.style.boxShadow = '0 0 10px cyan';
      }, 'border glow');
      this.registerCommand('play beep', (ctx) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      }, 'play beep');
      this.registerCommand('play click', (ctx) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.frequency.value = 800;
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      }, 'play click');
      this.registerCommand('move left', (ctx) => {
        ctx.guiBodyEl.style.transform = 'translateX(-20px)';
      }, 'move left');
      this.registerCommand('move right', (ctx) => {
        ctx.guiBodyEl.style.transform = 'translateX(20px)';
      }, 'move right');
      this.registerCommand('move up', (ctx) => {
        ctx.guiBodyEl.style.transform = 'translateY(-20px)';
      }, 'move up');
      this.registerCommand('move down', (ctx) => {
        ctx.guiBodyEl.style.transform = 'translateY(20px)';
      }, 'move down');
      this.registerCommand('font big', (ctx) => {
        ctx.guiBodyEl.style.fontSize = '30px';
      }, 'font big');
      this.registerCommand('font small', (ctx) => {
        ctx.guiBodyEl.style.fontSize = '12px';
      }, 'font small');
      this.registerCommand('flash', (ctx) => {
        document.body.style.backgroundColor = 'white';
        setTimeout(() => document.body.style.backgroundColor = '', 100);
      }, 'flash');
    }

    evaluateArg(arg, ctx) {
      if (arg === undefined) return '';
      // If it's a variable name, return its value
      if (ctx.variables.has(arg)) return ctx.variables.get(arg);
      // Otherwise, try to parse as number or string
      if (!isNaN(arg)) return Number(arg);
      return arg;
    }

    print(msg) {
      if (this.guiActive) {
        this.guiBodyEl.innerHTML += msg + '<br>';
      } else {
        this.outputEl.innerHTML += msg + '<br>';
      }
    }

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    animate(el, type, duration, extraArgs) {
      if (!el) return;
      el.style.transition = `all ${duration}ms ease`;
      if (type === 'fade') {
        el.style.opacity = '0';
        setTimeout(() => el.style.opacity = '1', 10);
      } else if (type === 'move') {
        const x = extraArgs[0] || '0';
        const y = extraArgs[1] || '0';
        el.style.transform = `translate(${x}px, ${y}px)`;
      } else if (type === 'scale') {
        el.style.transform = `scale(${extraArgs[0] || 1.5})`;
      } else if (type === 'pulse') {
        el.style.transform = 'scale(1.1)';
        setTimeout(() => el.style.transform = 'scale(1)', duration/2);
      }
    }

    triggerEvent(eventType, element) {
      const handlers = this.eventHandlers.get(eventType) || [];
      handlers.forEach(h => {
        if (h.selector === element.id) {
          this.evaluateNode(h.action, this);
        }
      });
    }

    async evaluateNode(node, ctx) {
      if (!ctx.isRunning) return;
      ctx.lineNumber++;
      try {
        switch (node.type) {
          case 'Program':
            for (const stmt of node.body) {
              await this.evaluateNode(stmt, ctx);
              if (!ctx.isRunning) break;
            }
            break;
          case 'Command': {
            const cmd = ctx.commands.get(node.name);
            if (!cmd) throw new Error(`Unknown command "${node.name}"`);
            await cmd.handler(ctx, node.args);
            break;
          }
          case 'Assignment': {
            const val = this.evaluateExpression(node.value, ctx);
            ctx.variables.set(node.name, val);
            break;
          }
          case 'If': {
            const cond = this.evaluateExpression(node.condition, ctx);
            if (cond) {
              if (node.then) await this.evaluateNode(node.then, ctx);
            } else {
              if (node.else) await this.evaluateNode(node.else, ctx);
            }
            break;
          }
          case 'Repeat': {
            for (let i = 0; i < node.count && ctx.isRunning; i++) {
              await this.evaluateBlock(node.block, ctx);
            }
            break;
          }
          case 'FuncDef': {
            ctx.functions.set(node.name, { block: node.block });
            break;
          }
          case 'EventRegistration': {
            const [eventType, selector] = node.event.split(' ');
            if (!ctx.eventHandlers.has(eventType)) ctx.eventHandlers.set(eventType, []);
            ctx.eventHandlers.get(eventType).push({ selector, action: node.action });
            // If it's 'load', trigger immediately
            if (eventType === 'load') {
              await this.evaluateNode(node.action, ctx);
            }
            break;
          }
          default:
            throw new Error(`Unknown node type: ${node.type}`);
        }
      } catch (e) {
        ctx.print(`Line ${ctx.lineNumber}: ${e.message}`);
      }
    }

    evaluateExpression(expr, ctx) {
      // Simple evaluator: supports variables, numbers, strings, and ==, !=, <, >, <=, >=
      const tokens = expr.tokens;
      if (tokens.length === 1) {
        const val = tokens[0].value;
        if (ctx.variables.has(val)) return ctx.variables.get(val);
        return isNaN(val) ? val : Number(val);
      }
      // Binary expression
      const left = this.evaluateArg(tokens[0].value, ctx);
      const op = tokens[1].value;
      const right = this.evaluateArg(tokens[2].value, ctx);
      switch (op) {
        case '==': return left == right;
        case '!=': return left != right;
        case '<': return left < right;
        case '>': return left > right;
        case '<=': return left <= right;
        case '>=': return left >= right;
        default: return false;
      }
    }

    async evaluateBlock(block, ctx) {
      for (const stmt of block) {
        await this.evaluateNode(stmt, ctx);
        if (!ctx.isRunning || ctx.shouldReturn) break;
      }
    }
  }

  // ---------- Public API ----------
  return {
    commandDictionary: [], // filled after registration

    async run(codeLines, outputEl, guiBodyEl, gameAPI) {
      const ctx = new ExecutionContext(outputEl, guiBodyEl, gameAPI);
      // Build command dictionary for docs
      JLang.commandDictionary = Array.from(ctx.commands.entries()).map(([name, { description }]) => ({
        syntax: name,
        desc: description
      }));

      const parser = new Parser(codeLines);
      const ast = parser.parse();
      await ctx.evaluateNode(ast, ctx);
      ctx.print('-- Finished --');
      ctx.isRunning = false;
    },

    stopExecution() {
      // The running context will be stopped by the flag
    }
  };
})();
