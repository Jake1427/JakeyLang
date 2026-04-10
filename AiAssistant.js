// AiAssistant.js
window.AiAssistant = (function() {
  const responses = [
    { keywords: ['hello', 'hi', 'hey'], response: 'Hello! How can I help you with JLang?' },
    { keywords: ['say', 'print', 'output'], response: 'Use "say \"text\"" to print to the terminal.' },
    { keywords: ['variable', 'make', 'set'], response: 'Create a variable: make x = 5. Then you can use x in commands.' },
    { keywords: ['button', 'ui'], response: 'Create a button: create button "Click". Then handle click: on click button1 => say "clicked".' },
    { keywords: ['repeat', 'loop'], response: 'Repeat a block: repeat 5 times: (indented lines).' },
    { keywords: ['if', 'condition'], response: 'Conditional: if x == 5 then say "yes" else say "no".' },
    { keywords: ['function', 'func'], response: 'Define a function: func greet() (indented block) end func. Call it with call greet.' },
    { keywords: ['animation', 'animate'], response: 'Animate elements: animate fade button1 500, animate move x y 1000, pulse button1, shake screen.' },
    { keywords: ['game', 'player', 'enemy'], response: 'Game commands: spawn player, move player x y, set speed 5, spawn enemy, detect collision.' },
    { keywords: ['wait', 'delay'], response: 'Pause execution: wait 1000 (in milliseconds).' },
    { keywords: ['ask', 'input', 'prompt'], response: 'Get user input: ask "What is your name?"' },
    { keywords: ['color', 'style'], response: 'Style UI: set text color "red", set bg color "#000", set font size 20.' },
    { keywords: ['event', 'on click', 'on hover'], response: 'Events: on click button1 => say "clicked", on load => say "ready", on interval 1000 => say "tick".' },
    { keywords: ['help', 'commands'], response: 'Check the ❓ icon for the full command list!' }
  ];

  function fuzzyMatch(query, keywords) {
    query = query.toLowerCase();
    return keywords.some(kw => query.includes(kw) || kw.includes(query));
  }

  return {
    ask(query) {
      const q = query.toLowerCase().trim();
      for (const item of responses) {
        if (fuzzyMatch(q, item.keywords)) {
          return item.response;
        }
      }
      return 'I\'m not sure about that. Try asking about "say", "variables", "buttons", "repeat", "if", "functions", "animations", or "game".';
    }
  };
})();
