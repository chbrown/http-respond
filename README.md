## http-respond

[![npm version](https://badge.fury.io/js/http-respond.svg)](https://www.npmjs.com/package/http-respond)

Adaptive (i.e., kitchen-sink), opinionated, HTTP response handler for Node.js.

    npm i -S http-respond

Example `server.js`:

    import {createServer} from 'http';
    import {createReadStream} from 'fs';
    // Layout and App are both React.Component classes
    import {Layout, App} from './components';

    const metadata = {version: '1.0.5'};

    function router(req) {
      if (req.url == 'styles.css') {
        return {stream: createReadStream('./styles.css')};
      }
      else if (req.url == '/') {
        return {
          Component: App,
          LayoutComponent: Layout,
        };
      }
      else if (req.url == 'data.json') {
        return {props: metadata};
      }
      else {
        return {
          statusCode: 302,
          headers: [['Location', '/']],
        };
      }
    }

    createServer((req, res) => {
      let payload = router(req);
      respond(res, payload);
    }).listen(8080);


## License

Copyright 2016 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2016)
