# markdown-it-codesandbox-embed

markdown-it plugin for creating sandboxes on the fly for your code examples.

Install it with: `npm i markdown-it-codesandbox-embed`

Use:

```javascript
const mdCodesandbox = require('markdown-it-codesandbox-embed')

// ...

md.use(mdCodesandbox, { directory: 'my-examples' /* Other options */ })

```

And in the markdown:

```md
# My example

@[codesandbox](example-1)

Also works with params:

@[codesandbox](example-1?view=split)
```

Then you should save your sandbox files in the `my-examples/example-1/` folder.

## Options

Options with defaults:

```javascript
{
    directory: 'examples', // directory where you store your sandboxes
    templateFn: undefined // custom template function that takes the url and return the embed markup, url => markup. By default it renders an iframe.
}
```
