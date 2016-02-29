import Relay from 'relay';
import IsomorphicRouter from 'isomorphic-relay-router';

// TODO: install react react-dom react-relay react-router react-router-relay isomorphic-relay isomorphic-relay-router
// TODO: check version compatibilities for the above packages

export default (options) => {
    // TODO: validate options

    // Initialize middleware
    Relay.injectNetworkLayer(new Relay.DefaultNetworkLayer(options.graphqlUrl));

    // Return middleware
    return async (ctx, next) => {
        await next();
    };
};
