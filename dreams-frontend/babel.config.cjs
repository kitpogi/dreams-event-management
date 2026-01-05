module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  env: {
    test: {
      plugins: [
        // Transform import.meta.env to process.env for Jest
        function() {
          return {
            visitor: {
              MetaProperty(path) {
                // Check if this is import.meta
                if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                  // We need to handle this in the parent MemberExpression
                  // This plugin will be called before MemberExpression, so we'll handle it there
                }
              },
              MemberExpression(path) {
                // Check if this is import.meta.env or import.meta.env.VITE_API_BASE_URL
                const node = path.node;
                if (
                  node.object &&
                  node.object.type === 'MetaProperty' &&
                  node.object.meta &&
                  node.object.meta.name === 'import' &&
                  node.object.property &&
                  node.object.property.name === 'meta'
                ) {
                  // This is import.meta.something
                  const t = require('@babel/types');
                  if (t.isIdentifier(node.property) && node.property.name === 'env') {
                    // Transform import.meta.env to process.env
                    path.replaceWith(
                      t.memberExpression(t.identifier('process'), t.identifier('env'))
                    );
                  }
                }
              },
            },
          };
        },
      ],
    },
  },
};

