// polyfill for async/await
require("babel-register");
require("babel-polyfill");

import React from 'react';
import ReactDOM from 'react-dom/server';
import Relay from 'react-relay';
import {match} from 'react-router';
import IsomorphicRouter from 'isomorphic-relay-router';
import Helmet from 'react-helmet';

export default (options) => {
    // Validate options
    if (!options.graphqlUrl) {
        throw new Error('Missing options.graphqlUrl');
    } else if (!options.routes) {
        throw new Error('Missing options.routes');
    } else if (!options.render) {
        throw new Error('Missing options.render');
    }

    // Initialize middleware
    Relay.injectNetworkLayer(new Relay.DefaultNetworkLayer(options.graphqlUrl));

    // Return middleware
    return async (ctx) => {
        const {redirectLocation, renderProps} = await new Promise((resolve, reject) => {
            match({
                routes: options.routes,
                location: ctx.req.url
            }, (err, redirectLocation, renderProps) => {
                if (err) {
                    return reject(err);
                }
                return resolve({redirectLocation, renderProps});
            });
        });

        if (redirectLocation) {
            ctx.redirect(redirectLocation.pathname + redirectLocation.search);
        } else if (renderProps) {
            const {data, props} = await IsomorphicRouter.prepareData(renderProps);
            const reactOutput = ReactDOM.renderToString(
                <IsomorphicRouter.RouterContext {...props} />
            );
            const preloadedData = JSON.stringify(data);
            const helmet = Helmet.rewind();

            ctx.status = 200;
            ctx.body = await options.render(reactOutput, preloadedData, helmet);
        } else {
            ctx.throw(404, 'Not found');
        }
    };
};
