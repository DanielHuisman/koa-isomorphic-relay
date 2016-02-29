import ReactDOM from 'react-dom/server';
import Relay from 'relay';
import {match} from 'react-router';
import IsomorphicRouter from 'isomorphic-relay-router';

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
            const reactOutput = ReactDOM.rendertoString(
                <IsomorphicRouter.RoutingContext {...props} />
            );
            const preloadedData = JSON.stringify(data);

            ctx.status = 200;
            ctx.body = await options.render(reactOutput, preloadedData);
        } else {
            ctx.throw(404, 'Not found');
        }

        // match({
        //     routes: options.routes,
        //     location: ctx.req.url
        // }, (err, redirectLocation, renderProps) => {
        //     if (err) {
        //         ctx.throw(500, err.message);
        //     } else if (redirectLocation) {
        //         ctx.redirect(redirectLocation.pathname + redirectLocation.search);
        //     } else if (renderProps) {
        //         IsomorphicRouter.prepareData(renderProps).then(({data, props}) => {
        //             const reactOutput = ReactDOM.rendertoString(
        //                 <IsomorphicRouter.RoutingContext {...props} />
        //             );
        //             const preloadedData = JSON.stringify(data);
        //
        //             // TODO: render
        //         }, next);
        //     } else {
        //         ctx.throw(404, 'Not found');
        //     }
        // });
    };
};
