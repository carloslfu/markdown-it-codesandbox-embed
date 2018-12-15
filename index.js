const fs = require('fs');
const path = require('path');
const glob = require('glob');
const request = require('sync-request');

// Process @[codesandbox](sandbox-path)
// Process @[codesandbox](sandbox-path?params)

function getSandboxURL(directory, pathName) {
  const pathNameParts = pathName.split('?')
  const cwd = process.cwd()
  const directoryPath = path.join(cwd, directory, pathNameParts[0])
  const absolutePath = path.join(directoryPath, '**')
  const fileNames = glob.sync(absolutePath, { nodir: true })
  const files = {}
  for (let i = 0, fileName; fileName = fileNames[i]; i++) {
    files[path.relative(directoryPath, fileName)] = { content: fs.readFileSync(fileName, 'utf-8') }
  }

  var res = JSON.parse(request('POST', 'https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    json: { files },
  }).getBody('utf8'));
  
  const params = pathNameParts[1]
  const url = `https://codesandbox.io/embed/${res.sandbox_id}${params ? '?' + params : ''}`;
  return url;
}

const EMBED_REGEX = /@\[codesandbox]\([\s]*(.*?)[\s]*[)]/im;

function sandboxEmbed(md, options) {
  function sandboxReturn(state, silent) {
    var serviceEnd;
    var serviceStart;
    var token;
    var theState = state;
    const oldPos = state.pos;
    
    if (state.src.charCodeAt(oldPos) !== 0x40/* @ */ ||
    state.src.charCodeAt(oldPos + 1) !== 0x5B/* [ */) {
      return false;
    }
    
    const match = EMBED_REGEX.exec(state.src.slice(state.pos, state.src.length));

    if (!match || match.length < 2) {
      return false;
    }

    const sandboxPath = match[1];

    // If the videoID field is empty, regex currently make it the close parenthesis.
    if (sandboxPath === ')') {
      sandboxPath = '';
    }

    serviceStart = oldPos + 2;
    serviceEnd = md.helpers.parseLinkLabel(state, oldPos + 1, false);

    //
    // We found the end of the link, and know for a fact it's a valid link;
    // so all that's left to do is to call tokenizer.
    //
    if (!silent) {
      theState.pos = serviceStart;
      theState.service = theState.src.slice(serviceStart, serviceEnd);
      const newState = new theState.md.inline.State('codesandbox', theState.md, theState.env, []);
      newState.md.inline.tokenize(newState);

      token = theState.push('codesandbox', '');
      token.sandboxPath = sandboxPath;
      token.level = theState.level;
    }

    theState.pos += theState.src.indexOf(')', theState.pos);
    return true;
  }

  return sandboxReturn;
}

function tokenizeSandbox(md, options) {
  function tokenizeReturn(tokens, idx) {
    const sandboxPath = md.utils.escapeHtml(tokens[idx].sandboxPath);
    const sandboxUrl = getSandboxURL(options.directory, sandboxPath);
    if (options.templateFn) {
      return options.templateFn(sandboxUrl)
    } else {
      return `<iframe src="${sandboxUrl}" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>`;
    }
  }

  return tokenizeReturn;
}

const defaults = {
  directory: 'examples',
};

module.exports = function mdCodeSandboxPlugin(md, options) {
  var theOptions = options;
  var theMd = md;
  if (theOptions) {
    Object.keys(defaults).forEach(key => {
      if (typeof theOptions[key] === 'undefined') {
        theOptions[key] = defaults[key];
      }
    });
  } else {
    theOptions = defaults;
  }
  theMd.renderer.rules.codesandbox = tokenizeSandbox(theMd, theOptions);
  theMd.inline.ruler.before('emphasis', 'codesandbox', sandboxEmbed(theMd, theOptions));
};
